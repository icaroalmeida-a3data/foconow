const KEY = 'foconow.onboardingSeen'

export function hasSeenOnboarding() {
  return localStorage.getItem(KEY) === '1'
}

export function markOnboardingSeen() {
  localStorage.setItem(KEY, '1')
}
