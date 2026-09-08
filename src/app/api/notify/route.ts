import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminMessaging } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { sender, targetDriver: explicitTarget, title, body, type } = await req.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos (title, body)' },
        { status: 400 }
      );
    }

    // Si no se especifica targetDriver explícito, el destinatario natural es el otro conductor
    const targetDriver = explicitTarget || (sender === 'tei' ? 'adan' : 'tei');

    const adminDb = getAdminDb();
    const adminMessaging = getAdminMessaging();

    if (!adminDb || !adminMessaging) {
      console.warn('Firebase Admin no disponible para enviar push');
      return NextResponse.json({
        success: false,
        warning: 'Firebase Admin no configurado',
        sender,
        targetDriver,
      });
    }

    // 1. Obtener tokens de FCM registrados para el conductor destinatario
    const tokensSnapshot = await adminDb
      .collection('push_tokens')
      .where('driver', '==', targetDriver)
      .get();

    const tokens: string[] = [];
    const docIds: string[] = [];

    for (const doc of tokensSnapshot.docs) {
      const data = doc.data();
      if (data && data.token) {
        tokens.push(data.token as string);
        docIds.push(doc.id);
      }
    }

    if (tokens.length === 0) {
      console.log(`No hay tokens push registrados para el conductor: ${targetDriver}`);
      return NextResponse.json({
        success: true,
        sentCount: 0,
        message: `No hay dispositivos registrados para ${targetDriver}`,
        targetDriver,
      });
    }

    // 2. Despachar las notificaciones push usando Firebase Admin SDK (FCM HTTP v1)
    const response = await adminMessaging.sendEachForMulticast({
      tokens,
      notification: {
        title,
        body,
      },
      webpush: {
        notification: {
          title,
          body,
          icon: '/logo.jpg',
          badge: '/logo.jpg',
          tag: 'horacar-update',
          renotify: true,
          requireInteraction: false,
        },
        fcmOptions: {
          link: '/',
        },
      },
      data: {
        sender: sender || 'system',
        type: type || 'update',
        title: title,
        body: body,
        url: '/',
      },
    });

    console.log(
      `Push enviado a ${targetDriver}: ${response.successCount} éxitos, ${response.failureCount} fallos`
    );

    // 3. Limpiar tokens caducados o inválidos automáticamente
    const tokensToDelete: Promise<any>[] = [];
    for (let idx = 0; idx < response.responses.length; idx++) {
      const resp = response.responses[idx];
      if (!resp.success && resp.error) {
        const errCode = resp.error.code;
        if (
          errCode === 'messaging/registration-token-not-registered' ||
          errCode === 'messaging/invalid-registration-token'
        ) {
          const docId = docIds[idx];
          if (docId) {
            tokensToDelete.push(adminDb.collection('push_tokens').doc(docId).delete());
          }
        }
      }
    }

    if (tokensToDelete.length > 0) {
      await Promise.all(tokensToDelete);
    }

    return NextResponse.json({
      success: true,
      sentCount: response.successCount,
      failureCount: response.failureCount,
      targetDriver,
      message: `Enviado a ${response.successCount} dispositivo(s)`,
    });
  } catch (error: any) {
    console.error('Error en /api/notify:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
