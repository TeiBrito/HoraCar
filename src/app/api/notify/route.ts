import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { sender, title, body, type } = await req.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos (title, body)' },
        { status: 400 }
      );
    }

    const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const serverKey = process.env.FIREBASE_SERVER_KEY;

    // Destinatario natural: Si Tei hace el cambio, el destinatario es Adán y viceversa
    const targetDriver = sender === 'tei' ? 'adan' : 'tei';

    // Si disponemos de la clave de servidor de Firebase (Cloud Messaging Legacy/Server Key)
    if (serverKey && targetDriver) {
      try {
        // Enviar a través del endpoint FCM con topic o directo
        await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${serverKey}`,
          },
          body: JSON.stringify({
            to: `/topics/driver_${targetDriver}`,
            notification: {
              title: title,
              body: body,
              icon: '/logo.jpg',
              click_action: '/',
            },
            data: {
              sender: sender,
              type: type || 'update',
              url: '/',
            },
          }),
        });
      } catch (fcmErr) {
        console.warn('Error enviando push por FCM API:', fcmErr);
      }
    }

    return NextResponse.json({
      success: true,
      sender,
      targetDriver,
      message: 'Notificación procesada correctamente',
    });
  } catch (error: any) {
    console.error('Error en /api/notify:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
