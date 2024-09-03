/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { DynamoDB } from 'aws-sdk';
import { DynamodbProvider } from './provider';

// interface Person {
//   id: string;
//   name: string;
//   age: number;
//   address: string;
//   zip: string;
// }

export async function testProviderTyping() {
  const db = new DynamodbProvider({
    dynamoDB: {
      target: 'v2',
      instance: new DynamoDB.DocumentClient({
        region: 'us-east-1',

        credentials: {
          accessKeyId: 'ASIA27LY4UML47HMZRZD',
          secretAccessKey: 'Ok2TV5XTZMtzQeULhtJNCkkanIolYzbPILoxvAlK',
          sessionToken:
            'IQoJb3JpZ2luX2VjELD//////////wEaCXVzLWVhc3QtMSJGMEQCIBQM5lkFdweCzjpTmbhD2PEP9H6io7BeWlIsGtVnlXjGAiBi/mQnF1BA6ajC0MBS/xMrTYxyHB36tBBrtrtYwQlKVSrxAgjJ//////////8BEAIaDDc1NDU1NzE2NjM1OSIMg3ZHCyO3B/tsv4uuKsUC8Omay5TZnvbAMnZN3vHdd/aFRPZ+ihS2aixtiR2ZAaOHGWgjWJBWPeY4Gn2EyYbZdI26ZjV8AMTqPaEGSU9DqL3J1K014YxiJFZGrxjW5FCiL8UYZznwirkvvgX1X7GNLDpVnLd9ycu4/xFgDuLn7+E/BWhZUCI5Hg8f4ylyDHC9p58XD9Zm+jldyiluuMzm1V8S7nMVqS0LCRt9NyvQbifzyl/+sSpxZK/zsTijkIAYZcPB+jbUs4fl8MxW0dSHRCwi4JzLPYbCEyFWQ7s+6b7m84gUrMUGHggHp9e+33WIkm+NV6+7zB7/K5Y7i+Rrcq2ZYES/tQC5Zl6IBlX0Yx0Xrm1iY1HLWD/ZwFUNwRR/OUYMY+ftKPkKQ27zqmu+EnQAlDkXuZVehp/uopr8i34/ZBg2KAd+IA4+zYOBgtDEIidqMjDiu962BjqoARqUJ/d9mVtUzBZrgZEkJy34lsw5dVgfyAqhuljCuIfw54y6gXENmf/Sc/VLBM99kppkLT9krq/Qem8zsRfMbdlk4Qg95uJNE5ObYQLiXqgTFPJ5NoaECxU/S4YmnmoybWg1HPDdUTLiOqmiIwrn+y0T80HFalj6SmknB8j44701wGBz9PCBbVVaagUvRqQ31wdrEpV8EF8uPwwaKc7S/aMSRkLJ5HdIuw==',
        },
      }),
    },
  });

  console.log(
    await db.get({
      table: 'DB_PROVIDER_TEST',
      key: {
        ':_pk': 'sss',
        _sk: 'ccc',
      },
    }),
  );
}
