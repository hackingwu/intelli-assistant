package cn.intellijassistant.admin.service.impl;

import cn.intellijassistant.admin.service.ISnsService;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.IOException;

/**
 * @Author: Jason Wu
 * @Date: 2023/9/4
 * @Description:
 */
@Component
public class SnsServiceImpl implements ISnsService {
    private static final String AD="d3g0YjZlNTJkYTEyNDJkZDdh";
    private static final String SC = "NjFiN2YxZjJlMTVmZjYzYTIxOTI0NTEzMTAzN2Q4MTY=";

    OkHttpClient client = new OkHttpClient().newBuilder()
            .build();

    @Override
    public String openid(@RequestParam String code) throws IOException {

        String url = "https://api.weixin.qq.com/sns/jscode2session?appid=wx4b6e52da1242dd7a&secret=61b7f1f2e15ff63a219245131037d816&js_code="+code+"&grant_type=authorization_code ";
        Request request = new Request.Builder()
                .url(url)
                .build();
        Response response = client.newCall(request).execute();
        return response.body().string();
    }
}
