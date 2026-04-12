export default {
  common: {
    appName: 'Portal Solution',
    actions: {
      close: 'Fechar',
    },
  },
  layout: {
    logout: 'Sair',
    menu: {
      dashboard: 'Dashboard',
    },
  },
  views: {
    login: {
      subtitle: 'Acesse sua conta para continuar',
      emailLabel: 'E-mail',
      passwordLabel: 'Senha',
      submit: 'Entrar',
      validation: {
        emailRequired: 'E-mail obrigatorio',
        emailInvalid: 'E-mail invalido',
        passwordRequired: 'Senha obrigatoria',
        passwordMin: 'Minimo 6 caracteres',
      },
    },
    home: {
      title: 'Area autenticada',
      welcome: 'Sessao ativa com base da Sprint 1.',
    },
  },
}
