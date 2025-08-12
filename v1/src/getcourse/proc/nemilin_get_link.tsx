import { get } from '@app/request';
import { Debug } from '../../../lib/debug.lib';

// Константа для уровня логирования всего файла
const LOG_LEVEL: 'info' | 'warn' | 'error' = 'warn';

// Устанавливаем префикс для логов
Debug.setLogPrefix('[nemilin_get_link]');

/**
 * Ответ внешнего API nemilin.pro
 */
interface ExternalApiResponse {
  status: string; // ожидаем "ok" при успехе
  url: string;    // ссылка для подключения к закрытому чату
}

/**
 * GET / — если нет параметров в query, возвращает указание перейти на маршрут /info; 
 * если есть project и tarif, выполняет запрос к API; 
 * при других случаях — ошибка.
 */
app.get('/', async (ctx, req) => {
  const query = req.query as Record<string, string>;
  const keys = Object.keys(query);

  // Нет параметров — подсказываем перейти на /info
  if (keys.length === 0) {
    new Debug(ctx, 'Запрос без параметров: подсказка использовать /info', LOG_LEVEL, 'info');
    return 'Для получения инструкции по использованию модуля перейдите по адресу ~info';
  }

  // Есть параметры, проверяем обязательные
  const { project, tarif } = query;
  if (!project || !tarif) {
    new Debug(ctx, 'Неполный набор параметров: требуются project и tarif', LOG_LEVEL, 'error', 'MISSING_PARAMS');
    throw new Debug(ctx, 'Отсутствуют обязательные параметры project и tarif', LOG_LEVEL, 'error', 'MISSING_PARAMS');
  }

  // Формируем URL и выполняем запрос
  const targetUrl = `https://nemilin.pro/API/v1/getaccesslink/${project}/${tarif}/1`;
  new Debug(ctx, `Сформирован конечный URL: ${targetUrl}`, LOG_LEVEL, 'info');

  try {
    new Debug(ctx, 'Отправка GET-запроса во внешний API', LOG_LEVEL, 'info');
    const raw = await get(targetUrl, {
      headers: { Authorization: '***' },
      responseType: 'json',
    });

    const body = raw.body as ExternalApiResponse;
    if (body.status !== 'ok' || !body.url) {
      throw new Debug(ctx, 'Получен некорректный ответ от внешнего API', LOG_LEVEL, 'error', 'UNEXPECTED_API_RESPONSE');
    }

    new Debug(ctx, `Получена корректная ссылка: ${body.url}`, LOG_LEVEL, 'info');
    return body.url;

  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Неизвестная ошибка';
    throw new Debug(ctx, `Ошибка при получении ссылки: ${message}`, LOG_LEVEL, 'error', 'EXTERNAL_API_ERROR');
  }
});

/**
 * HTML-маршрут /info: возвращает подробную инструкцию по использованию модуля
 */
app.html('/info', (ctx, req) => {
  new Debug(ctx, 'Запрос инструкции через /info', LOG_LEVEL, 'info');
  return `
    <html>
      <head><title>Инструкция использования</title></head>
      <body>
        <h1>Модуль активен и работает</h1>
        <p>Для получения ссылки отправьте GET-запрос на адрес с параметрами:</p>
        <ul>
          <li><code>project</code>: ID проекта (например <code>3y7a</code>)</li>
          <li><code>tarif</code>: ID тарифа (например <code>493046</code>)</li>
        </ul>
        <p>Пример: <code>GET /?project=3y7a&tarif=493046</code></p>
      </body>
    </html>
  `;
}); 
