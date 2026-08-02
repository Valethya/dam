const MAX_BODY_BYTES = 20_000;

function json(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function cleanLine(value, maxLength) {
  return String(value ?? '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export default async function contact(request) {
  if (request.method !== 'POST') {
    return json({ message: 'Método no permitido.' }, 405);
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ message: 'El mensaje es demasiado extenso.' }, 413);
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json({ message: 'Formato de solicitud inválido.' }, 415);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.CONTACT_RECIPIENT_EMAIL;
  const sender = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !recipient || !sender) {
    console.error('Contact form email environment variables are not configured.');
    return json({ message: 'El formulario aún no está disponible. Intenta más tarde.' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'No pudimos leer el mensaje.' }, 400);
  }

  if (body.website) {
    return json({ ok: true });
  }

  const name = cleanLine(body.name, 100);
  const email = cleanLine(body.email, 254).toLowerCase();
  const phone = cleanLine(body.phone, 50);
  const project = String(body.project ?? '').trim().slice(0, 5_000);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (name.length < 2 || project.length < 10 || !emailPattern.test(email)) {
    return json({ message: 'Revisa tu nombre, correo y descripción del proyecto.' }, 400);
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone || 'No indicado');
  const safeProject = escapeHtml(project).replaceAll('\n', '<br />');

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: sender,
      to: [recipient],
      reply_to: email,
      subject: `Nuevo proyecto DAM · ${name}`,
      text: [
        `Nombre: ${name}`,
        `Correo: ${email}`,
        `Teléfono: ${phone || 'No indicado'}`,
        '',
        'Proyecto:',
        project,
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111;line-height:1.6">
          <p style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#666">Nuevo contacto desde damfilms.cl</p>
          <h1 style="font-size:30px;line-height:1.1;margin:20px 0 30px">${safeName} quiere conversar sobre un proyecto.</h1>
          <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
            <tr><td style="padding:10px 0;border-bottom:1px solid #ddd;color:#666">Correo</td><td style="padding:10px 0;border-bottom:1px solid #ddd;text-align:right">${safeEmail}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #ddd;color:#666">Teléfono</td><td style="padding:10px 0;border-bottom:1px solid #ddd;text-align:right">${safePhone}</td></tr>
          </table>
          <h2 style="font-size:14px;letter-spacing:.12em;text-transform:uppercase">Idea o proyecto</h2>
          <p style="font-size:17px">${safeProject}</p>
          <p style="margin-top:32px;font-size:12px;color:#777">Responde este correo para escribir directamente a ${safeName}.</p>
        </div>
      `,
    }),
  });

  if (!resendResponse.ok) {
    console.error('Resend rejected the contact email.', resendResponse.status);
    return json({ message: 'No pudimos enviar el mensaje. Intenta nuevamente.' }, 502);
  }

  return json({ ok: true }, 201);
}
