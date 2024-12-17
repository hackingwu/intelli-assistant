package cn.intellijassistant.admin.controller;

import cn.intellijassistant.admin.conf.Configuration;
import cn.intellijassistant.admin.dto.ScheduleInfoDTO;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import lombok.extern.slf4j.Slf4j;
import okhttp3.Cache;
import okhttp3.Dns;
import okhttp3.HttpUrl;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.dnsoverhttps.DnsOverHttps;
import org.joda.time.DateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.concurrent.TimeUnit;

/**
 * @Author: Jason Wu
 * @Date: 2023/8/23
 * @Description:
 */
@RestController
@Slf4j
@RequestMapping("/admin/help_remember")
public class HelpRememberController {

    @Autowired
    private ResourceLoader resourceLoader;

    @Autowired
    private Configuration configuration;

    public String requestBodyFormat;

    public static final String QianWenApiKey = "sk-your key";
    public static final String QIANWEN_API_ENDPOINT = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

    private String promptTemplate;

    @PostConstruct
    public void postConstruct(){
        Resource resource = resourceLoader.getResource("classpath:help_remember_request_body.json");
        try (InputStream inputStream = resource.getInputStream();
             BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            StringBuilder content = new StringBuilder();
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                content.append(line).append("\n");
            }
            requestBodyFormat = content.toString();
            // Use the resource content as needed
        } catch (IOException e) {
            // Handle the exception
        }

        // 读取提示词模板
        Resource promptResource = resourceLoader.getResource("classpath:qianwen_prompt_template.txt");
        try (InputStream promptInputStream = promptResource.getInputStream();
             BufferedReader promptBufferedReader = new BufferedReader(new InputStreamReader(promptInputStream, StandardCharsets.UTF_8))) {
            StringBuilder promptContent = new StringBuilder();
            String promptLine;
            while ((promptLine = promptBufferedReader.readLine()) != null) {
                promptContent.append(promptLine).append("\n");
            }
            promptTemplate = promptContent.toString();
        } catch (IOException e) {
            log.error("Failed to load prompt template", e);
            // 设置一个默认的提示词模板作为后备
            promptTemplate = "你是一个日程提取助手。请帮我从用户输入中提取日程信息。\n" +
                    "当前时间是：%s\n用户输入：%s\n" +
                    "请返回JSON格式：{\"dateTimeFrom\":\"yyyy-MM-dd HH:mm\",\"timeDuration\":0,\"title\":\"\",\"location\":\"\"}";
        }
    }

    public static final String EMPTY_SCHEDULE_STR = JSON.toJSONString(new ScheduleInfoDTO());
    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm");

    Cache appCache = new Cache(new File("cacheDir", "okhttpcache"), 10 * 1024 * 1024);
    OkHttpClient bootstrapClient = new OkHttpClient.Builder().cache(appCache).build();

    //加速国内云对azure的访问
    Dns dns = new DnsOverHttps.Builder().client(bootstrapClient)
            .url(HttpUrl.get("https://1.1.1.1/dns-query"))
            .build();

    OkHttpClient azureClient = bootstrapClient.newBuilder()
            .readTimeout(15, TimeUnit.SECONDS)

            .build();
    public static final ScheduleInfoDTO EMPTY_SCHEDULE = new ScheduleInfoDTO();

    public static final String QIANWEN_MODEL = "qwen-turbo";

    @PostMapping("")
    public ScheduleInfoDTO save(@RequestBody HashMap<String, String> map) {
        String text = map.get("text");
        if (text == null || text.trim().length() < 6) return EMPTY_SCHEDULE;
        return requestQianWen(text);

    }

    private ScheduleInfoDTO requestOpenAi(String text) {
        long start = System.currentTimeMillis();
        String textJson = JSON.toJSONString(text);
        String formattedDate = dateFormat.format(new Date());
        MediaType mediaType = MediaType.parse("application/json");
        String bodyStr = String.format(requestBodyFormat, formattedDate, textJson);
        okhttp3.RequestBody body = okhttp3.RequestBody.create(mediaType, bodyStr);
        Request request = new Request.Builder()
                .url(configuration.getOpenaiAzureEndpoint())
                .method("POST", body)
                .addHeader("Content-Type", "application/json")
                .addHeader("api-key", configuration.getOpenaiAzureApiKey())
                .build();
        String responseBody = "";
        long requestStart = System.currentTimeMillis();
        try {
            Response response = azureClient.newCall(request).execute();
            responseBody = response.body().string();

        } catch (Exception e) {
            log.error("OPENAI请求失败：{}, text:{}, response: {}", e.getMessage(), text, responseBody);
            return EMPTY_SCHEDULE;
        }
        long requestEnd = System.currentTimeMillis();
        JSONObject jsonObject = JSON.parseObject(responseBody);

        try {
            String s = jsonObject.getJSONArray("choices").getJSONObject(0).getJSONObject("message").getJSONObject("function_call").getString("arguments");
            ScheduleInfoDTO result = JSON.parseObject(s, ScheduleInfoDTO.class);
            DateTime dateTime = new DateTime(result.getDateTimeFrom());
            if (dateTime.getHourOfDay() == 0) dateTime = dateTime.withHourOfDay(8);
            //识别返回的可能会没有小时信息，所以重新识别
            result.setDateTimeFrom(dateTime.toString("yyyy-MM-dd HH:mm"));
            result.setTimestampFrom(dateTime.getMillis());

            result.setDescription(text);
            log.warn("openai请求耗时:{}, 接口耗时：{}", (requestEnd - requestStart), (System.currentTimeMillis() - start));
            return result;
        } catch (Exception e) {
            log.error("解析失败: text:{}, response:{}", text, responseBody);
            return EMPTY_SCHEDULE;
        }
    }


    private ScheduleInfoDTO requestQianWen(String text) {
        long start = System.currentTimeMillis();
        String formattedDate = dateFormat.format(new Date());
        // 使用加载的模板
        String prompt = String.format(promptTemplate, formattedDate, text);
        
        // 构建通义千问的请求体
        JSONObject requestBody = new JSONObject();
        requestBody.put("model", QIANWEN_MODEL);
        
        JSONObject input = new JSONObject();
        input.put("prompt", prompt);
        requestBody.put("input", input);
        
        JSONObject parameters = new JSONObject();
        parameters.put("result_format", "json");
        parameters.put("temperature", 0.7);
        parameters.put("top_p", 0.8);
        requestBody.put("parameters", parameters);

        MediaType mediaType = MediaType.parse("application/json");
        okhttp3.RequestBody body = okhttp3.RequestBody.create(mediaType, requestBody.toJSONString());
        
        Request request = new Request.Builder()
                .url(QIANWEN_API_ENDPOINT)
                .method("POST", body)
                .addHeader("Content-Type", "application/json")
                .addHeader("Authorization", "Bearer " + QianWenApiKey)
                .build();
                
        String responseBody = "";
        long requestStart = System.currentTimeMillis();
        try {
            Response response = azureClient.newCall(request).execute();
            responseBody = response.body().string();
        } catch (Exception e) {
            log.error("千问API请求失败：{}, text:{}, response: {}", e.getMessage(), text, responseBody);
            return EMPTY_SCHEDULE;
        }
        long requestEnd = System.currentTimeMillis();
        
        try {
            JSONObject jsonObject = JSON.parseObject(responseBody);
            // 通义千问的返回格式：output.text 中包含生成的JSON字符串
            String generatedJson = jsonObject.getJSONObject("output").getString("text");
            // 移除可能的多余字符，确保是纯JSON
            generatedJson = generatedJson.trim();
            if (generatedJson.startsWith("```json")) {
                generatedJson = generatedJson.substring(7, generatedJson.length() - 3).trim();
            }
            
            ScheduleInfoDTO result = JSON.parseObject(generatedJson, ScheduleInfoDTO.class);
            if (result == null || result.getDateTimeFrom() == null) {
                return EMPTY_SCHEDULE;
            }

            DateTime dateTime = DateTime.parse(result.getDateTimeFrom(),
                    org.joda.time.format.DateTimeFormat.forPattern("yyyy-MM-dd HH:mm"));

            if (dateTime.getHourOfDay() == 0) {
                dateTime = dateTime.withHourOfDay(8);
            }
            result.setDateTimeFrom(dateTime.toString("yyyy-MM-dd HH:mm"));
            result.setTimestampFrom(dateTime.getMillis());
            result.setDescription(text);
            
            log.warn("千问请求耗时:{}, 接口耗时：{}", (requestEnd - requestStart), (System.currentTimeMillis() - start));
            return result;
        } catch (Exception e) {
            e.printStackTrace();
            log.error("解析失败: text:{}, response:{}", text, responseBody);
            return EMPTY_SCHEDULE;
        }
    }

}

