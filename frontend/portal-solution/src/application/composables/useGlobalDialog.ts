import { reactive, readonly } from 'vue'

type DialogType = 'info' | 'warning' | 'error' | 'success'

interface DialogState {
  visible: boolean
  title: string
  message: string
  type: DialogType
}

const state = reactive<DialogState>({
  visible: false,
  title: '',
  message: '',
  type: 'info',
})

function open(title: string, message: string, type: DialogType = 'info') {
  state.title = title
  state.message = message
  state.type = type
  state.visible = true
}

function close() {
  state.visible = false
}

export function useGlobalDialog() {
  return {
    state: readonly(state),
    open,
    close,
  }
}
