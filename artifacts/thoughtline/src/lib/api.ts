import { setAuthTokenGetter } from '@workspace/api-client-react';

export const TOKEN_KEY = 'thoughtline_token';

setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));
