import { z } from 'zod'

/**
 * Zod 4 prueba si puede compilar validadores con `new Function` y, si puede, lo
 * hace. La política de contenido del panel no permite `eval` (C-05): la prueba
 * quedaba como violación en cada pantalla. Sin JIT valida igual, con el
 * intérprete, y para formularios de este tamaño la diferencia no se nota.
 */
z.config({ jitless: true })
