// @ts-ignore
import { getUserGroups, getUserCustomFields, setUserCustomFields } from '@getcourse/sdk';
import { get } from '@app/request';

// Тип ответа от внешнего API
interface ExternalApiResponse {
  status: string;
  url: string;
}

// Тип пользовательского дополнительного поля
interface UserCustomField {
  id: number;
  title: string;
}

app.get('/', async (ctx, req) => {
  const { tarif } = req.query;
  const tarifStr = String(tarif);

  // Карта тарифов с массивами ссылок
  const tarifLinks: Record<string, string[]> = {
    '1': [
      'https://nemilin.pro/API/v1/getaccesslink/3y7a/493046/1',
      'https://nemilin.pro/API/v1/getaccesslink/574u/502282/1',
      'https://nemilin.pro/API/v1/getaccesslink/3yb0/464323/1'
    ],
    '2': [
      'https://nemilin.pro/API/v1/getaccesslink/3y7a/464319/1',
      'https://nemilin.pro/API/v1/getaccesslink/574u/601155/1',
      'https://nemilin.pro/API/v1/getaccesslink/3yb0/464324/1'
    ],
    '3': [
      'https://nemilin.pro/API/v1/getaccesslink/3y7a/493047/1',
      'https://nemilin.pro/API/v1/getaccesslink/574u/601157/1',
      'https://nemilin.pro/API/v1/getaccesslink/3yb0/464340/1'
    ]
  };

  const fieldNames = ['link_chat_vip', 'link_chat_crypto', 'link_chat_osnova'] as const;

  if (!tarifStr || !tarifLinks[tarifStr]) {
    return {
      error: true,
      message: 'Unknown tarif parameter'
    };
  }

  try {
    if (!ctx.user) {
      return {
        error: true,
        message: 'User not found in context'
      };
    }

    const userId = ctx.user.id.split(':')[1];
    if (!userId) {
      return {
        error: true,
        message: 'Invalid user ID'
      };
    }

    const fieldsList = await getUserCustomFields(ctx) as UserCustomField[];
    ctx.account.log(`list: ${JSON.stringify(fieldsList, null, 2)}`);

    const fieldIdMap: Record<string, string> = {};
    for (const fieldName of fieldNames) {
      const foundField = fieldsList.find(f => f.title === fieldName);
      if (!foundField) {
        throw new Error(`Field ${fieldName} not found`);
      }
      fieldIdMap[fieldName] = foundField.id.toString();
    }

    // Быстрая запись всех ссылок без ожидания паузы
    for (let i = 0; i < fieldNames.length; i++) {
      const url = tarifLinks[tarifStr]?.[i];
      const fieldName = fieldNames[i];

      if (!url || !fieldName) {
        throw new Error('Missing URL or field name');
      }

      const fieldId = fieldIdMap[fieldName];

      if (!fieldId) {
        throw new Error(`Missing field ID for ${fieldName}`);
      }

      const rawResponse = await get(url, {
        headers: {
          Authorization: "***"
        },
        responseType: 'json'
      });

      const response = rawResponse.body as unknown as ExternalApiResponse;

      if (response.status !== 'ok' || !response.url) {
        throw new Error(`Error fetching URL for ${fieldName}`);
      }

      await setUserCustomFields(ctx, {
        userId: userId,
        fields: {
          [fieldId]: response.url
        }
      });
    }

    return { success: true };

  } catch (error: unknown) {
    if (error instanceof Error) {
      return {
        error: true,
        message: error.message
      };
    } else {
      return {
        error: true,
        message: 'Unknown error occurred'
      };
    }
  }
});
