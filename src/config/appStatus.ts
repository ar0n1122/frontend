const disabledFlag = (import.meta.env.VITE_APP_UNAVAILABLE ?? '').trim().toLowerCase()

export const isAppUnavailable = ['1', 'true', 'yes', 'on'].includes(disabledFlag)

export const appUnavailableMessage =
    import.meta.env.VITE_APP_UNAVAILABLE_MESSAGE?.trim() ||
    'Due to a technical issue, this app is temporarily unavailable.'