import { RouterModule } from '@nestjs/core';
import { AuthModule } from '../../features/auth/auth.module';

export default RouterModule.register([
  {
    path: '/api/v1',
    children: [
      {
        path: 'auth',
        module: AuthModule,
      },
    ],
  },
]);
