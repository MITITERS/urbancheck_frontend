/**
 * Every API path of the project. Nothing else in the codebase builds URL
 * strings by hand.
 *
 * Two families live here:
 * - `/_allauth/app/v1/...` — django-allauth "headless" endpoints, used for the
 *   session lifecycle. The session token they return travels in the
 *   `X-Session-Token` header on every later request.
 * - `/api/...` — the DRF API of the project.
 *
 * Note there is no municipality id anywhere: the API scopes every response to
 * the jurisdiction of the authenticated user, server-side.
 */

const ALLAUTH = '/_allauth/app/v1'
const API = '/api'

export const endpoints = {
  auth: {
    login: `${ALLAUTH}/auth/login`,
    session: `${ALLAUTH}/auth/session`,
    changePassword: `${ALLAUTH}/account/password/change`,
    requestPasswordReset: `${ALLAUTH}/auth/password/request`,
    resetPassword: `${ALLAUTH}/auth/password/reset`,
  },
  users: {
    me: `${API}/users/me/`,
    // No hay listado de usuarios: el backend lo sacó (C-01) porque exponía el
    // correo y el rol de todas las cuentas.
    detail: (id: number) => `${API}/users/${id}/`,
  },
  geo: {
    /** Catálogo oficial de la división política argentina (Georef). */
    provinces: `${API}/geo/provinces/`,
    localities: (provinceId: string) =>
      `${API}/geo/provinces/${provinceId}/localities/`,
  },
  municipalities: {
    list: `${API}/municipalities/`,
    detail: (id: number) => `${API}/municipalities/${id}/`,
    /** Las estadísticas de esa municipalidad, vistas por el admin (US-023). */
    statistics: (id: number) => `${API}/municipalities/${id}/statistics/`,
  },
  municipalAgents: {
    list: `${API}/municipal-agents/`,
    activate: (id: number) => `${API}/municipal-agents/${id}/activate/`,
    deactivate: (id: number) => `${API}/municipal-agents/${id}/deactivate/`,
  },
  validators: {
    list: `${API}/validators/`,
    activate: (id: number) => `${API}/validators/${id}/activate/`,
    deactivate: (id: number) => `${API}/validators/${id}/deactivate/`,
  },
  /** Áreas operativas del municipio (US-039). */
  operationalAreas: {
    list: `${API}/operational-areas/`,
    detail: (id: number) => `${API}/operational-areas/${id}/`,
    activate: (id: number) => `${API}/operational-areas/${id}/activate/`,
    deactivate: (id: number) => `${API}/operational-areas/${id}/deactivate/`,
  },
  /** Operarios de un área operativa (US-044). */
  operators: {
    list: `${API}/operators/`,
    detail: (id: number) => `${API}/operators/${id}/`,
    activate: (id: number) => `${API}/operators/${id}/activate/`,
    deactivate: (id: number) => `${API}/operators/${id}/deactivate/`,
  },
  panelReports: {
    list: `${API}/panel/reports/`,
    detail: (id: number) => `${API}/panel/reports/${id}/`,
    /** Un endpoint por transición: los permisos y los campos difieren. */
    transition: (id: number, operation: string) =>
      `${API}/panel/reports/${id}/${operation}/`,
    /**
     * Reasignación de área (US-028). Va aparte de las transiciones porque no
     * mueve el estado: el reporte permanece En proceso.
     */
    assignArea: (id: number) => `${API}/panel/reports/${id}/assign-area/`,
    /** Publicación de una respuesta oficial (US-024). Solo alta. */
    officialResponses: (id: number) => `${API}/panel/reports/${id}/official-responses/`,
  },
  /**
   * Solicitudes por dato personal visible (US-043). Las resuelve el admin de
   * la plataforma, de todas las municipalidades: no pasan por jurisdicción.
   */
  privacyRequests: {
    list: `${API}/platform/privacy-requests/`,
    removeImage: (id: number) => `${API}/platform/privacy-requests/${id}/remove-image/`,
    dismiss: (id: number) => `${API}/platform/privacy-requests/${id}/dismiss/`,
  },
  /**
   * Moderación de contenido (US-049). La bandeja es del agente; las
   * apelaciones, del agente (las de su municipio) y del admin (todas), las dos
   * por jurisdicción. La reversión de oficio es solo del admin.
   */
  moderation: {
    list: `${API}/panel/moderation/`,
    count: `${API}/panel/moderation/count/`,
    resolved: `${API}/panel/moderation/resolved/`,
    discard: (reportId: number) => `${API}/panel/moderation/${reportId}/discard/`,
    dismiss: (reportId: number) => `${API}/panel/moderation/${reportId}/dismiss/`,
  },
  /** Estadísticas del agente: una sola respuesta para la sección (US-023). */
  statistics: {
    panel: `${API}/panel/statistics/`,
  },
  moderationAppeals: {
    list: `${API}/panel/moderation-appeals/`,
    accept: (id: number) => `${API}/panel/moderation-appeals/${id}/accept/`,
    reject: (id: number) => `${API}/panel/moderation-appeals/${id}/reject/`,
    revert: (reportId: number) =>
      `${API}/platform/reports/${reportId}/revert-moderation/`,
  },
  /**
   * La página pública de un reporte compartido (US-030): el único endpoint que
   * responde sin sesión. Se busca por el token del enlace, nunca por id.
   */
  publicReports: {
    detail: (token: string) => `${API}/public/reports/${token}/`,
  },
  reports: {
    list: `${API}/reports/`,
    detail: (id: number) => `${API}/reports/${id}/`,
    comments: (id: number) => `${API}/reports/${id}/comments/`,
  },
  notifications: {
    list: `${API}/notifications/`,
    detail: (id: number) => `${API}/notifications/${id}/`,
  },
} as const
