import { reactive } from 'vue';

type DialogType = 'info' | 'success' | 'warning' | 'error';

const state = reactive({
  show: false,
  title: '',
  message: '',
  type: 'info' as DialogType,
});

export function useGlobalDialog() {
  const open = (title: string, message: string, type: DialogType = 'info') => {
    state.title = title;
    state.message = message;
    state.type = type;
    state.show = true;
  };

  const close = () => {
    state.show = false;
  };

  return { state, open, close };
}
