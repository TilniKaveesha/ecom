/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    AbaPayway: {
      checkout: () => void
      init?: (config?: any) => void
      close?: () => void
    }
    jQuery: any
    $: any
  }
}

export {}
