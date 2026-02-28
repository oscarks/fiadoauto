import { reactive } from 'vue';

type SnackbarType = 'success' | 'error' | 'warning' | 'info';

const state = reactive({
  show: false,
  message: '',
  type: 'info' as SnackbarType,
  timeout: 3000,
});

export function useSnackbar() {
  const notify = (message: string, type: SnackbarType = 'info', timeout = 3000) => {
    state.message = message;
    state.type = type;
    state.timeout = timeout;
    state.show = true;
  };

  return { state, notify };
}
