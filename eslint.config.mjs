import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: false,
  },
}).append({
  rules: {
    // Zero tolerance for `any`
    '@typescript-eslint/no-explicit-any': 'error',

    // Strict TS
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

    // Vue
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'off',
  },
})
