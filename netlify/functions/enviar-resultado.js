// Netlify Function: envía el resultado del análisis de viabilidad por email
// Usa Resend (resend.com) — tier gratuito 3,000 emails/mes
// Variable de entorno requerida: RESEND_API_KEY

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    return { statusCode: 503, body: JSON.stringify({ error: 'Servicio de email no configurado' }) }
  }

  try {
    const { nombre, email, giro, alcaldia, analisis } = JSON.parse(event.body)

    if (!email || !analisis) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos requeridos' }) }
    }

    const nivelEmoji = { ALTO: '✅', MEDIO: '⚠️', BAJO: '❌', MUY_BAJO: '🚫' }[analisis.nivel] || '📊'
    const nivelLabel = { ALTO: 'Alta Viabilidad', MEDIO: 'Viabilidad Media', BAJO: 'Viabilidad Baja', MUY_BAJO: 'No Recomendable' }[analisis.nivel] || analisis.nivel
    const colorHex   = { ALTO: '#10B981', MEDIO: '#F59E0B', BAJO: '#EF4444', MUY_BAJO: '#6B7280' }[analisis.nivel] || '#006847'

    const oportunidades = analisis.oportunidades?.map(o => `<li style="margin-bottom:6px;">✅ ${o}</li>`).join('') || ''
    const riesgos       = analisis.riesgos?.map(r => `<li style="margin-bottom:6px;">⚠️ ${r}</li>`).join('') || ''

    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">

  <!-- Header -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#006847;">
    <tr>
      <td style="padding:24px 32px;">
        <p style="margin:0;color:#fff;font-size:12px;opacity:.7;">CIUDAD DE MÉXICO · SECRETARÍA DE DESARROLLO ECONÓMICO</p>
        <h1 style="margin:4px 0 0;color:#fff;font-size:22px;font-weight:900;">🏛️ Evaluador de Viabilidad CDMX</h1>
      </td>
    </tr>
    <tr><td style="height:4px;background:linear-gradient(90deg,#006847 0%,#CE1126 50%,#FFFFFF 100%);"></td></tr>
  </table>

  <!-- Body -->
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr>
      <td style="padding:32px 24px;">

        <p style="margin:0 0 8px;color:#333;font-size:16px;">Hola, <strong>${nombre || 'Emprendedor'}</strong>:</p>
        <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
          Aquí está el análisis de viabilidad para tu negocio <strong>${giro}</strong> en <strong>${alcaldia}</strong>.
        </p>

        <!-- Score -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:20px;overflow:hidden;border-top:4px solid ${colorHex};">
          <tr>
            <td style="padding:24px;text-align:center;">
              <div style="display:inline-block;width:100px;height:100px;border-radius:50%;border:8px solid ${colorHex};background:${colorHex}18;text-align:center;line-height:84px;">
                <span style="font-size:36px;font-weight:900;color:${colorHex};">${analisis.score}</span>
              </div>
              <p style="margin:8px 0 0;font-size:13px;font-weight:700;color:${colorHex};">${nivelEmoji} ${nivelLabel}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;">
              <p style="margin:0;color:#333;font-size:14px;line-height:1.7;background:#f9f9f9;border-radius:8px;padding:12px;">
                ${analisis.resumen}
              </p>
            </td>
          </tr>
        </table>

        <!-- Métricas clave -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <tr>
            <td width="33%" style="padding:4px;">
              <div style="background:#fff;border-radius:8px;padding:16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.06);">
                <p style="margin:0 0 4px;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Inversión estimada</p>
                <p style="margin:0;font-size:13px;font-weight:700;color:#333;">
                  $${(analisis.inversion_estimada?.min||0).toLocaleString()} – $${(analisis.inversion_estimada?.max||0).toLocaleString()}
                </p>
                <p style="margin:2px 0 0;font-size:10px;color:#aaa;">MXN</p>
              </div>
            </td>
            <td width="33%" style="padding:4px;">
              <div style="background:#fff;border-radius:8px;padding:16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.06);">
                <p style="margin:0 0 4px;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Tiempo de apertura</p>
                <p style="margin:0;font-size:22px;font-weight:900;color:#333;">${analisis.tiempo_apertura_meses}</p>
                <p style="margin:2px 0 0;font-size:10px;color:#aaa;">meses</p>
              </div>
            </td>
            <td width="33%" style="padding:4px;">
              <div style="background:#fff;border-radius:8px;padding:16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.06);">
                <p style="margin:0 0 4px;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Demanda esperada</p>
                <p style="margin:0;font-size:18px;font-weight:900;color:#333;">${analisis.demanda?.nivel || '—'}</p>
                <p style="margin:2px 0 0;font-size:10px;color:#aaa;">en la zona</p>
              </div>
            </td>
          </tr>
        </table>

        <!-- Oportunidades y riesgos -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <tr>
            <td width="50%" style="padding:4px;vertical-align:top;">
              <div style="background:#ECFDF5;border-radius:8px;padding:16px;">
                <p style="margin:0 0 10px;font-weight:700;color:#10B981;font-size:13px;">✅ Oportunidades</p>
                <ul style="margin:0;padding-left:16px;color:#374151;font-size:13px;line-height:1.6;">
                  ${oportunidades}
                </ul>
              </div>
            </td>
            <td width="50%" style="padding:4px;vertical-align:top;">
              <div style="background:#FEF2F2;border-radius:8px;padding:16px;">
                <p style="margin:0 0 10px;font-weight:700;color:#EF4444;font-size:13px;">⚠️ Riesgos a considerar</p>
                <ul style="margin:0;padding-left:16px;color:#374151;font-size:13px;line-height:1.6;">
                  ${riesgos}
                </ul>
              </div>
            </td>
          </tr>
        </table>

        <!-- Tip clave -->
        <div style="background:#FFF7ED;border-left:4px solid #F59E0B;border-radius:0 8px 8px 0;padding:16px;margin-bottom:24px;">
          <p style="margin:0 0 4px;font-weight:700;color:#D97706;font-size:12px;text-transform:uppercase;">💡 Consejo clave</p>
          <p style="margin:0;color:#92400E;font-size:14px;line-height:1.6;">${analisis.tip_clave || ''}</p>
        </div>

        <!-- CTA -->
        <div style="text-align:center;margin-bottom:32px;">
          <a href="https://viabilidad-cdmx.netlify.app"
             style="display:inline-block;background:#006847;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;">
            Ver ruta de trámites →
          </a>
        </div>

      </td>
    </tr>
  </table>

  <!-- Footer -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;border-top:1px solid #ddd;">
    <tr>
      <td style="padding:16px 24px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#888;">
          Secretaría de Desarrollo Económico · Ciudad de México<br>
          Este análisis es orientativo y no constituye asesoría legal. AppHack CDMX 2026.
        </p>
      </td>
    </tr>
  </table>

</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SEDECO CDMX <noreply@sedeco-cdmx.mx>',
        to: [email],
        subject: `${nivelEmoji} Análisis de viabilidad: ${giro} en ${alcaldia}`,
        html,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Error al enviar email')

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, id: data.id }),
    }
  } catch (err) {
    console.error('enviar-resultado error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
