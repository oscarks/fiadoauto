import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_METADATA_KEY } from './metadata.constants';

export const Public = () => SetMetadata(IS_PUBLIC_METADATA_KEY, true);
