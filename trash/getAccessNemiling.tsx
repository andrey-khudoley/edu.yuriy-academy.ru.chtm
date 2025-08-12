import { get } from '@app/request';
import { HookParams } from '@templates/sdk';

interface ExternalApiResponse {
  status: string;
  url: string;
}

app.accountHook('@builder/hook-node-actions/KCIYvluE4f', async (ctx, p: any) => {
  const params = p as HookParams<undefined>;
  ctx.account.log(`[KCIYvluE4f] start`);

  // Извлекаем projectID и tarifID из props
  const projectID = params.agentsByType?.session?.props?.projectID;
  const tarifID = params.agentsByType?.session?.props?.tarifID;
  if (!projectID || !tarifID) {
    throw new Error('Отсутствуют projectID или tarifID в props');
  }

  // Формируем URL и выполняем запрос
  const apiUrl = `https://nemilin.pro/API/v1/getaccesslink/${projectID}/${tarifID}/1`;
  const rawResponse = await get(apiUrl, {
    headers: { Authorization: '***' },
    responseType: 'json'
  });
  const response = rawResponse.body as ExternalApiResponse;

  if (response.status !== 'ok' || !response.url) {
    throw new Error('Ошибка получения ссылки');
  }

  return {
    success: true,
    data: response.url
  };
});
