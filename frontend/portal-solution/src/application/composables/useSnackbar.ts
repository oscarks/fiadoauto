import { reactive, readonly } from 'vue'

type SnackbarType = 'success' | 'error' | 'info' | 'warning'

interface SnackbarState {
  visible: boolean
  message: string
  type: SnackbarType
  timeout: number
}

const state = reactive<SnackbarState>({
  visible: false,
  message: '',
  type: 'info',
  timeout: 3500,
})

function show(message: string, type: SnackbarType = 'info', timeout = 3500) {
  state.message = message
  state.type = type
  state.timeout = timeout
  state.visible = true
}

function close() {
  state.visible = false
}

export function useSnackbar() {
  return {
    state: readonly(state),
    show,
    close,
  }
}
