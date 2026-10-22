/**
 * Every user-facing string lives here: components never hardcode Spanish text.
 * Kept as a flat, nested-by-area object so it can be swapped for a real i18n
 * library later without touching call sites.
 */
export const messages = {
  app: {
    name: 'UrbanCheck',
    subtitle: 'Panel municipal',
    /** Bajada del logo, la misma que usa la app móvil. */
    tagline: 'Comunidad Conectada',
    /** Rótulo del dato que la topbar muestra a la izquierda. */
    municipalityLabel: 'Municipio',
  },
  nav: {
    reports: 'Reportes',
    validators: 'Validadores',
    areas: 'Áreas operativas',
    municipalities: 'Municipalidades',
    agents: 'Agentes municipales',
    moderation: 'Denuncias',
    moderationAppeals: 'Apelaciones',
    statistics: 'Estadísticas',
    /** Lo que lee un lector de pantalla junto al contador del menú. */
    pendingCount: (count: number) => `${count} pendientes`,
    logout: 'Cerrar sesión',
  },
  common: {
    cancel: 'Cancelar',
    save: 'Guardar',
    saving: 'Guardando…',
    retry: 'Reintentar',
    loadError: 'No pudimos cargar la información.',
    empty: 'Todavía no hay nada para mostrar.',
    yes: 'Sí',
    no: 'No',
  },
  municipalities: {
    title: 'Municipalidades',
    description:
      'Municipios habilitados en la plataforma. El área de cobertura decide qué reportes le llegan a cada uno.',
    create: 'Registrar municipalidad',
    createTitle: 'Nueva municipalidad',
    editTitle: 'Editar municipalidad',
    city: 'Ciudad',
    province: 'Provincia',
    coverage: 'Área de cobertura',
    coverageHelp:
      'Elegí la provincia y la ciudad: el mapa se ubica solo y ahí trazás el límite.',
    provincePlaceholder: 'Elegí una provincia',
    provinceLoading: 'Cargando provincias…',
    cityPlaceholder: 'Elegí una ciudad',
    citySearch: 'Escribí el nombre…',
    cityLoading: 'Cargando ciudades…',
    cityNeedsProvince: 'Elegí primero la provincia',
    cityNoMatches: 'No hay ciudades con ese nombre.',
    cityUnavailable:
      'No pudimos cargar las ciudades de esa provincia. Marcá el centro en el mapa.',
    boundary: 'Límite del municipio',
    boundaryHelp:
      'Hacé clic en el mapa para marcar los vértices del límite. Seguí los bordes reales —un río, una ruta— para que no se pise con el municipio de al lado.',
    boundaryEmpty: 'Todavía no marcaste ningún punto.',
    boundaryPoints: (count: number) =>
      count === 1 ? '1 punto marcado' : `${count} puntos marcados`,
    boundaryTooFew: (missing: number) =>
      missing === 1
        ? 'Falta 1 punto para cerrar el área.'
        : `Faltan ${missing} puntos para cerrar el área.`,
    boundaryUndo: 'Deshacer',
    boundaryClear: 'Borrar todo',
    boundaryColumn: 'Límite',
    boundaryPointsShort: (count: number) => `${count} puntos`,
    noBoundary: 'Sin límite trazado',
    reports: 'Reportes',
    users: 'Usuarios',
    createdAt: 'Alta',
    actions: 'Acciones',
    edit: 'Editar',
    delete: 'Eliminar',
    empty: 'Todavía no hay municipalidades registradas.',
    created: 'Municipalidad registrada.',
    updated: 'Municipalidad actualizada.',
    deleted: 'Municipalidad eliminada.',
    deletedWithStaff: (users: number) =>
      users === 1
        ? 'Municipalidad eliminada. Su cuenta de trabajo quedó archivada.'
        : `Municipalidad eliminada. Sus ${users} cuentas de trabajo quedaron archivadas.`,
    // La baja arrastra dos cosas distintas y el aviso las nombra por separado:
    // quien la ejecuta no ve ninguna de las dos desde esta pantalla, y «lo que
    // cayó» en una sola cifra no dejaría entender qué hay que volver a habilitar.
    deletedWithAreas: (areas: number) =>
      areas === 1
        ? 'Municipalidad eliminada. Su área operativa quedó desactivada.'
        : `Municipalidad eliminada. Sus ${areas} áreas operativas quedaron desactivadas.`,
    deletedWithStaffAndAreas: (users: number, areas: number) =>
      `Municipalidad eliminada. Quedaron archivadas ${users} ${
        users === 1 ? 'cuenta de trabajo' : 'cuentas de trabajo'
      } y desactivadas ${areas} ${areas === 1 ? 'área operativa' : 'áreas operativas'}.`,
    deleteTitle: '¿Eliminar esta municipalidad?',
    deleteDescription:
      'Deja de recibir reportes nuevos y desaparece del listado. Sus reportes y usuarios se conservan para no perder el historial.',
    deleteStaffWarning:
      'Sus agentes y validadores quedan desactivados: pasan al archivado de cada sección y dejan de trabajar. Si volvés a dar de alta la municipalidad, hay que reactivarlos de a uno.',
    deleteWithData: (reports: number, users: number) =>
      `Tiene ${reports} ${reports === 1 ? 'reporte' : 'reportes'} y ${users} ${users === 1 ? 'usuario' : 'usuarios'} asociados.`,
    deleteConfirm: 'Eliminar municipalidad',
    coverageOf: (city: string) => `Cobertura de ${city}`,
  },
  reports: {
    title: 'Reportes',
    description: 'Reclamos recibidos en tu municipio.',
    empty: 'No hay reportes que coincidan con los filtros.',
    /** Salida al detalle desde una superficie que no es la tabla: el mapa. */
    openDetail: 'Ver el reporte',
    columns: {
      id: '#',
      category: 'Categoría',
      status: 'Estado',
      createdAt: 'Fecha',
      address: 'Ubicación',
      likes: 'Likes',
      operativeArea: 'Área operativa',
      officialResponse: 'Respuesta',
    },
    /** Indicador de la columna de respuesta oficial (US-024, escenario 13). */
    answered: 'Respondido',
    unanswered: 'Sin respuesta oficial',
    /** Señal de la comparación automática del cierre (US-015, escenario 3). */
    closureReview: 'Cierre a revisar',
    /** US-042: todavía no se publicó porque su imagen sigue en el difuminado. */
    notPublished: 'Sin publicar',
    notPublishedHint:
      'Su imagen todavía se está difuminando: ningún vecino ve este reporte y no se puede gestionar hasta que se publique.',
    notPublishedFailedHint:
      'No pudimos difuminar su imagen y el reporte no llegó a publicarse. Su autor puede volver a cargarlo con otra foto.',
    closureReviewHint:
      'La comparación automática encontró dudas en el cierre. Es una sugerencia, no una determinación.',
    filters: {
      status: 'Estado',
      category: 'Categoría',
      zone: 'Zona',
      zonePlaceholder: 'Buscar por dirección…',
      createdFrom: 'Desde',
      createdTo: 'Hasta',
      ordering: 'Ordenar por',
      clear: 'Limpiar filtros',
      clearDate: 'Quitar la fecha',
      allStatuses: 'Todos los estados',
      allCategories: 'Todas las categorías',
      selected: (count: number) => `${count} seleccionados`,
      review: 'Revisión',
      closureReview: 'Solo cierres a revisar',
    },
    ordering: {
      newest: 'Más recientes',
      oldest: 'Más antiguos',
      mostLiked: 'Más apoyados',
      leastLiked: 'Menos apoyados',
    },
    pagination: {
      summary: (from: number, to: number, total: number) => `${from}–${to} de ${total}`,
      previous: 'Anterior',
      next: 'Siguiente',
      pageSize: 'Reportes por página',
      perPage: (size: number) => `${size} por página`,
    },
    status: {
      pendiente_validacion: 'Pendiente de Validación',
      reportado: 'Reportado',
      en_proceso: 'En proceso',
      // Corto a propósito: es una etiqueta de tabla, y el detalle explica de
      // qué se trata con el plazo restante al lado.
      resuelto_pendiente_confirmacion: 'Pendiente de confirmación',
      resuelto: 'Resuelto',
      cancelado: 'Cancelado',
      archivado: 'Archivado',
    },
    category: {
      bache: 'Bache',
      alumbrado: 'Alumbrado',
      basura: 'Basura',
      semaforo: 'Semáforo',
      vereda: 'Vereda',
      otro: 'Otro',
    },
  },
  areas: {
    title: 'Áreas operativas',
    description:
      'Las dependencias de tu municipalidad que resuelven los reportes. A cada reporte validado se le asigna una, y sus operarios lo ven en la app.',
    adminDescription:
      'Las dependencias que resuelven los reportes de la municipalidad elegida en el encabezado.',
    create: 'Registrar un área',
    createTitle: 'Nueva área operativa',
    editTitle: 'Editar área operativa',
    name: 'Nombre',
    namePlaceholder: 'Obras Públicas',
    contactEmail: 'Email de contacto',
    contactPhone: 'Teléfono de contacto',
    contactPhoneHint:
      'Un solo número por área: el de contacto principal de la dependencia.',
    municipality: 'Municipalidad',
    municipalityPlaceholder: 'Elegí una municipalidad',
    filterByMunicipality: 'Filtrar por municipalidad',
    allMunicipalities: 'Todas las municipalidades',
    contact: 'Contacto',
    state: 'Estado',
    reports: 'Reportes',
    operators: 'Operarios',
    active: 'Activa',
    inactive: 'Inactiva',
    edit: 'Editar',
    manage: 'Ver operarios',
    created: 'Área operativa registrada.',
    updated: 'Área operativa actualizada.',
    empty: 'Todavía no registraste ninguna área operativa.',
    emptyForMunicipality: 'Esta municipalidad todavía no tiene áreas operativas.',
    emptyArchived: 'No hay áreas desactivadas.',
    tabActive: 'Activas',
    tabArchived: 'Desactivadas',
    archivedHint:
      'Las áreas desactivadas dejan de ofrecerse al asignar reportes nuevos, pero conservan los que ya tenían.',
    deactivate: 'Desactivar',
    activate: 'Reactivar',
    deactivateTitle: '¿Desactivar esta área operativa?',
    deactivateDescription:
      'Deja de ofrecerse al asignar reportes nuevos. Los que ya tiene asignados conservan el vínculo y el área sigue visible en sus historiales.',
    deactivateReports: (count: number) =>
      count === 1
        ? 'Queda 1 reporte vinculado a esta área.'
        : `Quedan ${count} reportes vinculados a esta área.`,
    deactivateConfirm: 'Desactivar área',
    deactivated: 'El área quedó desactivada.',
    activated: 'El área vuelve a estar disponible.',
    backToList: 'Volver a áreas operativas',
    detailOperators: 'Operarios del área',
    detailDescription:
      'El personal de cuadrilla que ve los reportes de esta área desde la app móvil y registra su resolución.',
    inactiveWarning:
      'Esta área está desactivada: no recibe reportes nuevos y sus operarios no acceden a la bandeja.',
  },
  operators: {
    create: 'Dar de alta un operario',
    createTitle: 'Nuevo operario',
    editTitle: 'Editar operario',
    name: 'Nombre',
    email: 'Correo electrónico',
    phone: 'Teléfono',
    area: 'Área operativa',
    areaPlaceholder: 'Elegí un área activa',
    temporaryPassword: 'Contraseña temporal',
    temporaryPasswordHint:
      'El operario la usa una sola vez: la app le exige cambiarla en su primer ingreso.',
    state: 'Estado',
    closed: 'Cierres',
    active: 'Activo',
    inactive: 'Inactivo',
    pendingPassword: 'Contraseña temporal pendiente',
    empty: 'Esta área todavía no tiene operarios.',
    emptyArchived: 'Esta área no tiene operarios desactivados.',
    tabActive: 'Habilitados',
    tabArchived: 'Desactivados',
    created: 'Operario dado de alta.',
    updated: 'Operario actualizado.',
    edit: 'Editar',
    deactivate: 'Desactivar',
    activate: 'Reactivar',
    deactivateTitle: '¿Desactivar a este operario?',
    deactivateDescription:
      'Pierde el acceso a la aplicación de inmediato. La cuenta no se elimina: los cierres que ejecutó conservan su identidad en el historial de cada reporte.',
    deactivateReports: (count: number) =>
      count === 1
        ? 'El área tiene 1 reporte En proceso.'
        : `El área tiene ${count} reportes En proceso.`,
    deactivateConfirm: 'Desactivar operario',
    deactivated: 'El operario perdió el acceso a la aplicación.',
    activated: 'El operario vuelve a estar habilitado.',
    needsActiveArea:
      'Registrá primero un área operativa activa para poder dar de alta operarios.',
  },
  validatorProfile: {
    title: 'Validador',
    decisions: 'Decisiones en tu municipio',
    empty: 'Todavía no decidió ningún reporte en esta jurisdicción.',
    outcome: {
      validado: 'Validó',
      rechazado: 'Rechazó',
    },
    counts: (validated: number, rejected: number) =>
      `${validated} validados · ${rejected} rechazados`,
    openReport: 'Ver reporte',
  },
  operatorProfile: {
    title: 'Operario',
    closures: 'Cierres en tu municipio',
    empty: 'Todavía no cerró ningún reporte en esta jurisdicción.',
    closedOn: (date: string) => `Cerrado el ${date}`,
    // Un cierre objetado volvió a gestión (US-048): no está confirmado ni
    // esperando, así que se cuenta aparte en vez de desaparecer del resumen.
    counts: (confirmed: number, awaiting: number, appealed: number) =>
      `${confirmed} confirmados · ${awaiting} a confirmar · ${appealed} objetados`,
    openReport: 'Ver reporte',
  },
  profile: {
    title: 'Perfil del vecino',
    memberSince: 'Vecino desde',
    reports: 'Reportes',
    reportsHere: 'Reportes en tu municipio',
    reportsInMunicipality: (city: string) => `Reportes en ${city}`,
    private:
      'Este vecino tiene su perfil en privado, así que no se muestran su antigüedad ni su actividad en la plataforma.',
    noReports: 'No tiene reportes en esta jurisdicción.',
    close: 'Cerrar',
    openReport: 'Ver reporte',
  },
  reportDetail: {
    backToList: 'Volver al listado',
    notFound: 'Ese reporte no existe o no pertenece a tu municipio.',
    description: 'Descripción',
    location: 'Ubicación',
    noLocation: 'El reporte no tiene coordenadas cargadas.',
    author: 'Vecino',
    likes: 'Apoyos',
    validatedBy: 'Validó',
    rejectedBy: 'Rechazó',
    // Sin persona: valida la cantidad, no alguien. Por eso no dice «Validó»
    // seguido de un nombre, como el de terreno.
    validatedByCommunity: 'Validado por la comunidad',
    comments: 'Comentarios',
    noComments: 'Todavía no hay comentarios.',
    history: 'Historial de cambios',
    historyEmpty: 'Sin movimientos registrados.',
    initialStatus: 'Alta del reporte',
    // El admin ejecuta las acciones del panel con las reglas del agente (C-15).
    actedAsPlatformAdmin: 'como administración de la plataforma',
    reason: 'Motivo',
    actions: 'Acciones',
    awaitingValidation:
      'Este reporte aguarda validación en terreno. Hasta que un validador lo confirme, no hay acciones disponibles desde el panel.',
    finalStatus: 'El reporte llegó a un estado final: no admite más cambios.',
    reasonLabel: 'Motivo de la cancelación',
    reasonPlaceholder: 'Contale al vecino por qué no se puede avanzar.',
    confirmTitle: (action: string) => `¿${action} este reporte?`,
    updated: 'El estado del reporte se actualizó.',
    conflict: 'El reporte cambió de estado mientras lo mirabas. Actualizamos la vista.',
    area: 'Área responsable',
    areaEmpty: 'Todavía no se le asignó un área operativa.',
    areaInactive: 'Esta área fue desactivada, pero sigue a cargo del reporte.',
    areaReassign: 'Reasignar área',
    areaReassignTitle: 'Reasignar el área responsable',
    areaLabel: 'Área operativa',
    areaPlaceholder: 'Elegí un área activa',
    areaRequired: 'Elegí el área que se va a hacer cargo.',
    areaReassigned: 'El reporte cambió de área responsable.',
    areaHistory: 'Asignaciones de área',
    areaAssignedInitial: (area: string) => `Asignado a ${area}`,
    areaAssignedFrom: (from: string, to: string) => `${from} → ${to}`,
    noAreas:
      'Tu municipalidad todavía no tiene áreas operativas activas. Registrá una para poder empezar la gestión del reporte.',
    manageAreas: 'Ir a áreas operativas',
    officialResponses: 'Respuestas oficiales',
    officialResponsesEmpty:
      'El municipio todavía no publicó ninguna comunicación sobre este reporte.',
    officialResponsePublish: 'Publicar respuesta oficial',
    officialResponseLabel: 'Respuesta oficial',
    officialResponsePlaceholder:
      'Contale a la comunidad qué va a hacer el municipio, en qué plazo, o por qué no va a intervenir.',
    officialResponseHint:
      'Una vez publicada no se edita ni se elimina: una corrección se publica como una respuesta nueva.',
    officialResponseRequired: 'Escribí la respuesta antes de publicarla.',
    officialResponsePublished: 'La respuesta oficial quedó publicada.',
    officialResponseNotAllowed:
      'El municipio no publica respuestas oficiales sobre un reporte en este estado.',
    resolution: 'Resolución del operario',
    resolutionEmpty: 'Todavía no se registró la resolución del trabajo.',
    resolutionBy: (area: string) => `Ejecutado por ${area}`,
    resolutionOperator: 'Operario',
    resolutionAttempt: (n: number) => `Cierre ${n}`,
    appeal: 'Objeción del vecino',
    appealBy: 'Objetó el cierre',
    objectionDeadline: (date: string) =>
      `El vecino puede objetar el cierre hasta el ${date}`,
    objectionExpired: 'El plazo de objeción venció.',
    appealed: 'Este cierre fue objetado por el vecino y el reporte volvió a gestión.',
    /** Comparación automática del antes y el después (US-015). */
    comparison: {
      title: 'Comparación automática',
      disclaimer:
        'Sugerencia automática, no una determinación: no cambia el estado del reporte ni el plazo de objeción.',
      before: 'Foto del reporte',
      after: 'Foto del cierre',
      status: {
        pendiente: 'Comparación en curso.',
        completada: '',
        no_disponible: 'Comparación no disponible.',
        sin_material: 'No hay material suficiente para comparar.',
      },
      verdict: {
        consistente: 'Resolución consistente',
        problema_persistente: 'El problema sigue presente',
        lugar_distinto: 'Las fotos no parecen del mismo lugar',
        trabajo_incoherente: 'El cambio no coincide con lo declarado',
      },
      meta: (model: string, date: string) => `${model} · ${date}`,
    },
    /** Rótulo de cada origen de transición en el historial (US-038). */
    origin: {
      manual: '',
      validacion_terreno: 'Validación en terreno',
      validacion_colectiva: 'Validación colectiva',
      cierre_operario: 'Cierre del operario',
      confirmacion_automatica: 'Confirmación automática',
      apelacion_ciudadano: 'Objeción del vecino',
      archivado_inactividad: 'Archivado por inactividad',
      moderacion_municipal: 'Descarte por moderación',
      reversion_moderacion: 'Descarte revertido',
    },
    /** US-043: la foto se retiró, o el reporte está oculto mientras se revisa. */
    photoRemoved: 'Imagen retirada por protección de datos',
    withdrawn:
      'Retirado de la app: su foto mostraba un dato personal y se eliminó. Ningún vecino lo ve, salvo su autor.',
    underPrivacyReview:
      'Oculto al público: hay una denuncia por un dato personal visible en la imagen. Se resuelve desde Denuncias.',
    /** US-042: la imagen todavía no se difuminó, o no se pudo difuminar. */
    photoProcessing: 'Procesando la imagen para difuminar rostros y patentes',
    photoFailed: 'No pudimos procesar la imagen',
    notPublishedYet:
      'Sin publicar: su imagen se está difuminando. Ningún vecino lo ve todavía, y no se puede gestionar hasta que se publique.',
    photoProcessingFailed:
      'Sin publicar: no pudimos difuminar su imagen y el reporte no llegó a publicarse. Su autor puede volver a cargarlo con otra foto.',
    collectiveConfirmations: (count: number) =>
      count === 1 ? '1 confirmación' : `${count} confirmaciones`,
  },
  transitions: {
    procesar: {
      label: 'Comenzar gestión',
      description:
        'Elegí el área operativa que se hace cargo: el reporte pasa a En proceso y el vecino recibe el aviso.',
    },
    confirmar_resolucion_municipal: {
      label: 'Confirmar el cierre',
      description:
        'Verificaste la resolución del operario: el reporte pasa a Resuelto sin esperar a que venza el plazo de objeción del vecino. Es un estado final.',
    },
    cancelar: {
      label: 'Cancelar',
      description:
        'El reporte pasa a Cancelado, deja de verse en el feed y en el mapa, y no admite cambios posteriores.',
    },
    archivar: {
      label: 'Archivar',
      description:
        'El reporte pasa a Archivado y deja de verse en el feed y en el mapa.',
    },
    reactivar: {
      label: 'Reactivar',
      description: 'El reporte vuelve a Reportado y recupera su visibilidad pública.',
    },
  },
  validators: {
    title: 'Validadores',
    description:
      'Personal habilitado para verificar en terreno si un reporte corresponde a un problema real. Se dan de alta en tu municipalidad.',
    adminDescription:
      'Personal de la municipalidad elegida en el encabezado, habilitado para verificar en terreno si un reporte corresponde a un problema real.',
    noMunicipalities: 'Registrá una municipalidad antes de dar de alta validadores.',
    create: 'Dar de alta un validador',
    createTitle: 'Nuevo validador',
    municipality: 'Municipalidad',
    municipalityPlaceholder: 'Elegí una municipalidad',
    filterByMunicipality: 'Filtrar por municipalidad',
    allMunicipalities: 'Todas las municipalidades',
    name: 'Nombre',
    email: 'Correo electrónico',
    temporaryPassword: 'Contraseña temporal',
    temporaryPasswordHint:
      'El validador la usa una sola vez: la app le exige cambiarla antes de habilitar la validación.',
    state: 'Estado',
    validations: 'Validaciones',
    active: 'Activo',
    inactive: 'Inactivo',
    pendingPassword: 'Contraseña temporal pendiente',
    empty: 'Todavía no diste de alta ningún validador.',
    emptyForMunicipality: 'Esta municipalidad todavía no tiene validadores.',
    created: 'Validador dado de alta.',
    deactivate: 'Desactivar',
    activate: 'Reactivar',
    deactivateTitle: '¿Desactivar a este validador?',
    deactivateDescription:
      'Pierde la posibilidad de validar reportes. La cuenta es de trabajo: dada de baja, no puede usarla como vecino. Las validaciones que ya ejecutó se mantienen en el historial.',
    deactivateConfirm: 'Desactivar validador',
    deactivated: 'El validador ya no puede validar. Lo movimos a Archivados.',
    activated: 'El validador vuelve a estar habilitado.',
    tabActive: 'Habilitados',
    tabArchived: 'Archivados',
    emptyArchived: 'No hay validadores archivados.',
    emptyArchivedForMunicipality: 'Esta municipalidad no tiene validadores archivados.',
    archivedHint:
      'Los validadores que desactivás quedan acá, fuera del listado principal. Reactivá uno para que vuelva a la pestaña Habilitados.',
    cannotReactivate:
      'Su municipalidad está dada de baja. Volvé a darla de alta para poder reactivar a este validador.',
  },
  /** Solicitudes por dato personal visible (US-043). */
  privacy: {
    reportNumber: (number: number | string) => `Reporte #${number}`,
    reportPhoto: 'Foto del reporte',
    evidencePhoto: 'Foto del cierre del operario',
    appealPhoto: 'Foto de la objeción del vecino',
    imageGone: 'Imagen no disponible',
    overdue: 'Fuera de plazo',
    withinDeadline: 'En plazo',
    lateResolution: 'Fuera de plazo',
    status: {
      pendiente: 'Pendiente',
      imagen_eliminada: 'Imagen eliminada',
      desestimada: 'Desestimada',
    },
    removeImage: 'Eliminar imagen',
    dismiss: 'Desestimar',
    removeTitle: '¿Eliminar la imagen definitivamente?',
    removeDescription:
      'El archivo se borra del servidor y no se puede recuperar. Si es la foto del reporte, el reporte se retira de la app para siempre: un reporte sin foto no se vuelve a publicar. Si es la foto de un cierre, el reporte sigue publicado con la suya. Se le avisa al autor el motivo.',
    removeConfirm: 'Eliminar para siempre',
    dismissTitle: '¿Desestimar la solicitud?',
    dismissDescription:
      'La imagen queda como está y el reporte vuelve a verse de inmediato. La decisión queda registrada con tu usuario.',
    dismissConfirm: 'Desestimar',
    removedReport: 'La imagen se eliminó y el reporte quedó retirado de la app.',
    removedEvidence: 'La foto del cierre se eliminó; el reporte sigue publicado.',
    removedAppeal: 'La foto de la objeción se eliminó; el reporte sigue publicado.',
    dismissed: 'Solicitud desestimada: el reporte volvió a publicarse.',
    alreadyResolved: 'Otra persona ya resolvió esta solicitud.',
  },
  statistics: {
    title: 'Estadísticas',
    description:
      'Qué problemáticas predominan en tu municipio y cómo se están gestionando.',
    periodLabel: 'Período',
    periods: {
      '7d': 'Últimos 7 días',
      '30d': 'Últimos 30 días',
      '12m': 'Últimos 12 meses',
      custom: 'Rango personalizado',
    },
    from: 'Desde',
    to: 'Hasta',
    apply: 'Aplicar',
    /** Ningún número sin decir a qué ventana corresponde (escenario 5). */
    activeWindow: (start: string, end: string) => `Del ${start} al ${end}`,
    total: (count: number) =>
      count === 1 ? '1 reporte creado' : `${count} reportes creados`,
    rangeIncomplete: 'Elegí la fecha de inicio y la de fin.',
    rangeInverted: 'La fecha de inicio no puede ser posterior a la de fin.',
    rangeFuture: 'El rango no puede incluir fechas futuras.',
    empty: 'No hay reportes creados en este período.',
    byCategory: 'Por categoría',
    byStatus: 'Por estado',
    stages: 'Tiempo promedio por etapa',
    stagesNote:
      'La validación depende de los validadores y de los vecinos; la asignación y la resolución, del municipio. Los reportes abiertos no entran en los promedios.',
    validation: 'Validación',
    external: 'Fuera del municipio',
    validationSplit: (field: string, collective: string) =>
      `En terreno ${field} · Por la comunidad ${collective}`,
    assignment: 'Asignación',
    resolution: 'Resolución',
    sample: (count: number) => (count === 1 ? '1 caso' : `${count} casos`),
    noCases: 'Sin casos en el período',
    open: 'Abiertos ahora',
    oldest: (age: string) => `el más viejo, hace ${age}`,
    appealed: 'Cierres apelados',
    appealedDetail: (appealed: number, closures: number) =>
      `${appealed} de ${closures} cierres`,
    threshold: (threshold: number) => `Umbral ${threshold} %`,
    appealedAlert: (threshold: number) => `Supera el umbral del ${threshold} %`,
    exits: 'Salidas del circuito',
    cancellations: 'Cancelados',
    cancellationsFieldRejection: 'Rechazados en terreno',
    cancellationsModeration: 'Descartados por moderación',
    cancellationsMunicipal: 'Cancelados por el municipio',
    archived: 'Archivados por inactividad',
    reports: (count: number) => (count === 1 ? 'reporte' : 'reportes'),
    percent: (percentage: number | null) =>
      percentage === null ? '—' : `${percentage.toLocaleString('es-AR')} %`,
    groupOpen: 'En curso',
    groupResolved: 'Resueltos',
    groupOut: 'Fuera del circuito',
  },
  municipalityScope: {
    label: 'Municipalidad que estás viendo',
    onlyOne: 'Es la única municipalidad dada de alta.',
    none: 'Sin municipalidades',
    required:
      'Todavía no hay municipalidades dadas de alta. Creá una para ver sus datos.',
    fixed: 'Se da de alta en la municipalidad elegida en el encabezado.',
  },
  publicReport: {
    title: (number: number | string) => `Reporte #${number}`,
    reportedOn: (date: string) => `Reportado el ${date}`,
    likes: (count: number) =>
      count === 1 ? '1 vecino lo apoya' : `${count} vecinos lo apoyan`,
    description: 'Qué pasa',
    location: 'Dónde',
    timeline: 'Cómo avanzó',
    officialResponses: 'Lo que dijo el municipio',
    openInApp: 'Abrir en la app',
    cta: 'Sumate desde la app de UrbanCheck: reportá problemas de tu barrio y seguí su resolución junto al municipio.',
    unavailableTitle: 'Este reporte ya no está disponible',
    unavailableBody:
      'Puede haberse resuelto y archivado, o su autor lo eliminó. Gracias por interesarte en tu barrio.',
    discardedBody: 'El municipio descartó este reporte. Este es el motivo:',
    loadError: 'No pudimos cargar el reporte. Probá de nuevo en un rato.',
  },
  moderation: {
    title: 'Denuncias',
    description:
      'Reportes de tu municipio que los vecinos denunciaron. Las de contenido se resuelven una sola vez por reporte, con todas sus denuncias; las de dato personal, por imagen y dentro del plazo que muestra cada una.',
    adminDescription:
      'Denuncias de la municipalidad elegida. Las de dato personal las resolvés vos; las de contenido, su agente municipal.',
    filterLabel: 'Tipo de denuncia',
    filter: {
      todas: 'Todas',
      contenido_inapropiado: 'Contenido inapropiado',
      reporte_falso: 'Reporte falso',
      dato_personal: 'Dato personal visible',
    },
    tabPending: 'Pendientes',
    tabResolved: 'Resueltas',
    emptyResolved: 'Todavía no se resolvió ninguna denuncia.',
    columns: {
      image: 'Imagen',
      report: 'Reporte',
      type: 'Tipo',
      receivedAt: 'Recibida',
      deadline: 'Plazo',
      decision: 'Decisión',
      resolvedAt: 'Resuelta',
    },
    /**
     * Las de contenido no tienen plazo; las de dato personal, el que configura
     * el backend (`PERSONAL_DATA_REVIEW_MINUTES`) y llega en cada fila.
     */
    noDeadline: 'Sin plazo',
    reportPhoto: 'Foto del reporte',
    resolvedBy: 'Resolvió',
    decisionReason: 'Motivo',
    revertedBadge: 'Descarte revertido',
    empty: 'No hay denuncias esperando revisión.',
    complaintCount: (count: number) =>
      count === 1 ? '1 denuncia' : `${count} denuncias`,
    oldest: (date: string) => `La más antigua: ${date}`,
    reportedBy: 'Denunció',
    anonymousReporter: 'Cuenta eliminada',
    noComment: 'Sin comentario.',
    openReport: 'Ver reporte',
    discard: 'Descartar el reporte',
    dismiss: 'Desestimar',
    discardTitle: '¿Descartar el reporte?',
    discardDescription:
      'El reporte pasa a Cancelado y deja de verse en el feed y en el mapa. Todas sus denuncias quedan resueltas y el autor recibe un aviso con el motivo.',
    /** El contrapeso 1 de la historia: tiene que leerse antes de confirmar. */
    publicWarning:
      'El motivo que escribas es público: cualquier vecino lo ve en el reporte. El autor puede apelar tu decisión.',
    discardConfirm: 'Descartar',
    dismissTitle: '¿Desestimar las denuncias?',
    dismissDescription:
      'El reporte queda como está, publicado y en su estado. Las denuncias se cierran y los mismos vecinos no pueden volver a presentarlas.',
    dismissConfirm: 'Desestimar',
    reasonLabel: 'Motivo de tu decisión',
    reasonPlaceholder: 'Contá en pocas palabras por qué',
    reasonRequired: 'Indicá el motivo para poder continuar.',
    discarded: 'Reporte descartado.',
    dismissed: 'Denuncias desestimadas: el reporte sigue publicado.',
    alreadyResolved: 'Otra persona ya resolvió estas denuncias.',
    status: {
      pendiente: 'Pendiente',
      desestimada: 'Desestimada',
      reporte_descartado: 'Reporte descartado',
    },
    /** Card del detalle del reporte. */
    complaintsTitle: 'Denuncias',
    noComplaints: 'Nadie denunció este reporte.',
    resolveInInbox: 'Resolver en la bandeja de denuncias',
    listFlag: (count: number) => (count === 1 ? '1 denuncia' : `${count} denuncias`),
    listFlagHint: 'Tiene denuncias por contenido esperando tu decisión.',
    /** El descarte vigente, en el detalle. */
    discardedTitle: 'Descartado por moderación municipal',
    discardedBy: (name: string, date: string) => `Lo descartó ${name} el ${date}.`,
    publicReason: 'Motivo público',
    appealPending: 'El autor apeló la decisión: está pendiente en Apelaciones.',
    appealRejected: 'La apelación del autor fue rechazada.',
    revert: 'Revertir el descarte',
    revertTitle: '¿Revertir el descarte?',
    revertDescription: (status: string) =>
      `El reporte vuelve a «${status}», el estado que tenía antes del descarte, y se publica de nuevo. La reversión queda en el historial con tu usuario.`,
    revertConfirm: 'Revertir',
    reverted: 'Descarte revertido: el reporte volvió a publicarse.',
    notDiscarded: 'Este reporte ya no tiene un descarte vigente.',
  },
  moderationAppeals: {
    title: 'Apelaciones de moderación',
    description:
      'Vecinos que apelaron el descarte de su reporte por moderación. La decisión es definitiva: si no hacés lugar, el reporte queda cancelado y no admite otra apelación.',
    tabPending: 'Pendientes',
    tabResolved: 'Resueltas',
    emptyPending: 'No hay apelaciones esperando revisión.',
    emptyResolved: 'Todavía no se resolvió ninguna apelación.',
    agentReason: 'Motivo del municipio',
    authorReason: 'Lo que dice el vecino que reportó',
    complaints: 'Denuncias que lo motivaron',
    decidedBy: (name: string, date: string) => `Descartado por ${name} el ${date}`,
    appealedAt: (date: string) => `Apelado el ${date}`,
    accept: 'Hacer lugar',
    reject: 'Rechazar',
    acceptTitle: '¿Hacer lugar a la apelación?',
    acceptDescription:
      'El reporte vuelve al estado que tenía antes del descarte y se publica de nuevo. La reversión queda en el historial con tu usuario.',
    rejectTitle: '¿Rechazar la apelación?',
    rejectDescription:
      'El reporte queda cancelado y el vecino no puede volver a apelar. Le llega un aviso.',
    reasonLabel: 'Motivo de tu decisión',
    accepted: 'Apelación aceptada: el reporte volvió a publicarse.',
    rejected: 'Apelación rechazada.',
    alreadyResolved: 'Esta apelación ya fue resuelta.',
    status: {
      pendiente: 'Pendiente',
      aceptada: 'Aceptada',
      rechazada: 'Rechazada',
    },
    resolution: (name: string, date: string) => `Resolvió ${name} el ${date}`,
    resolutionLabel: 'Decisión sobre la apelación',
    photoAlt: (number: number) => `Foto del reporte #${number}`,
  },
  agents: {
    title: 'Agentes municipales',
    description:
      'Cuentas habilitadas para gestionar el panel de cada municipio. El agente debe cambiar su contraseña en el primer ingreso.',
    create: 'Dar de alta un agente',
    createTitle: 'Nuevo agente municipal',
    name: 'Nombre',
    email: 'Correo electrónico',
    temporaryPassword: 'Contraseña temporal',
    temporaryPasswordHint:
      'El agente la usa una sola vez: el sistema le exige cambiarla al ingresar.',
    municipality: 'Municipalidad',
    municipalityPlaceholder: 'Elegí una municipalidad',
    pendingPassword: 'Contraseña temporal pendiente',
    empty: 'Todavía no hay agentes municipales dados de alta.',
    created: 'Agente municipal dado de alta.',
    state: 'Estado',
    managed: 'Gestiones',
    active: 'Activo',
    inactive: 'Inactivo',
    deactivate: 'Desactivar',
    activate: 'Reactivar',
    deactivateTitle: '¿Desactivar a este agente municipal?',
    deactivateDescription:
      'Deja de operar el panel de su municipalidad de inmediato. La cuenta no se elimina —puede iniciar sesión y el panel le explica qué pasó— y todo lo que gestionó sigue en el historial de cada reporte, con su nombre.',
    deactivateConfirm: 'Desactivar agente',
    deactivated: 'El agente ya no opera el panel. Lo movimos a Archivados.',
    activated: 'El agente vuelve a operar el panel.',
    tabActive: 'Habilitados',
    tabArchived: 'Archivados',
    emptyArchived: 'No hay agentes archivados.',
    filterByMunicipality: 'Filtrar por municipalidad',
    allMunicipalities: 'Todas las municipalidades',
    emptyForMunicipality: 'Esta municipalidad todavía no tiene agentes.',
    emptyArchivedForMunicipality: 'Esta municipalidad no tiene agentes archivados.',
    archivedHint:
      'Los agentes que desactivás quedan acá, fuera del listado principal. Reactivá uno para que vuelva a la pestaña Habilitados.',
    cannotReactivate:
      'Su municipalidad está dada de baja. Volvé a darla de alta para poder reactivar a este agente.',
    noMunicipalities:
      'Registrá primero una municipalidad para poder darle de alta su agente.',
  },
  auth: {
    loginTitle: 'Ingresar al panel',
    email: 'Correo electrónico',
    password: 'Contraseña',
    submit: 'Ingresar',
    submitting: 'Ingresando…',
    invalidCredentials: 'Correo o contraseña incorrectos.',
    sessionExpired: 'Tu sesión expiró. Ingresá nuevamente.',
    checkingSession: 'Verificando sesión…',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
  },
  changePassword: {
    title: 'Cambiá tu contraseña',
    description:
      'Estás usando una contraseña temporal. Definí una nueva para continuar.',
    currentPassword: 'Contraseña actual',
    newPassword: 'Contraseña nueva',
    confirmPassword: 'Repetir contraseña nueva',
    submit: 'Guardar contraseña',
  },
  errors: {
    unexpected: 'Ocurrió un error inesperado. Intentá de nuevo.',
    network: 'No pudimos comunicarnos con el servidor.',
    notFound: 'No encontramos lo que buscabas.',
    forbidden: 'No tenés permisos para realizar esta acción.',
    // Sprint 5, punto 5.1: allauth lo manda en inglés y sin el tiempo de
    // espera; no dice si la cuenta existe, y este texto tampoco.
    tooManyRequests:
      'Hiciste demasiados intentos seguidos. Esperá unos minutos y probá de nuevo.',
  },
  forbidden: {
    title: 'Permisos insuficientes',
    description:
      'Esta aplicación es de uso exclusivo del personal municipal. Si sos ciudadano, validador u operario, usá la aplicación móvil de UrbanCheck.',
    // Para quien sí opera el panel pero entró a una sección de otro rol.
    sectionTitle: 'Esta sección no es de tu rol',
    sectionDescription:
      'Tu cuenta opera el panel, pero esta pantalla pertenece a otro rol. Volvé a tu sección para seguir trabajando.',
    goHome: 'Volver a mi sección',
    logout: 'Cerrar sesión',
    // Para una cuenta de trabajo dada de baja por el admin de la plataforma.
    deactivatedTitle: 'Tu cuenta está desactivada',
    deactivatedDescription:
      'El administrador de la plataforma desactivó tu cuenta, así que por ahora no podés operar el panel. Escribile si creés que es un error: tus datos y todo lo que gestionaste siguen intactos.',
  },
  notFound: {
    title: 'Página no encontrada',
    description: 'La dirección a la que quisiste entrar no existe.',
    back: 'Volver al inicio',
  },
} as const
