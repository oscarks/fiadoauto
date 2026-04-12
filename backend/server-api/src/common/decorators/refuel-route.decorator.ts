import { SetMetadata } from '@nestjs/common';

export const IS_REFUEL_ROUTE = 'isRefuelRoute';
export const RefuelRoute = () => SetMetadata(IS_REFUEL_ROUTE, true);
