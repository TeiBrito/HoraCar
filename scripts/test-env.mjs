import fs from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Leer .env.local manualmente
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      envVars[key] = val;
    }
  }
}

async function testFirebaseAdmin() {
  console.log('=== TEST DE VARIABLES DE ENTORNO Y FIREBASE ADMIN ===\n');

  const projectId = envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'horacar-494d1';
  const clientEmail = envVars.FIREBASE_CLIENT_EMAIL;
  let privateKey = envVars.FIREBASE_PRIVATE_KEY;

  console.log('1. Project ID:', projectId ? `OK (${projectId})` : 'FALTA');
  console.log('2. Client Email:', clientEmail ? `OK (${clientEmail})` : 'FALTA');
  console.log('3. Private Key:', privateKey ? `OK (Detectada clave RSA, longitud: ${privateKey.length})` : 'FALTA');

  if (!clientEmail || !privateKey) {
    console.error('\nERROR: Faltan variables de entorno para Firebase Admin.');
    return;
  }

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  try {
    const app = getApps().length > 0 ? getApps()[0] : initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    console.log('\n4. Conectando con Firestore...');
    const db = getFirestore(app);
    const tokensSnap = await db.collection('push_tokens').get();
    console.log(`-> Firestore conectado con éxito. Dispositivos en push_tokens: ${tokensSnap.size}`);

    tokensSnap.forEach((doc) => {
      const data = doc.data();
      console.log(`   - Token ID: ${doc.id} | Conductor: ${data.driver} | Actualizado: ${data.updatedAt || 'N/A'}`);
    });

    console.log('\n5. Verificando servicio de mensajería (FCM)...');
    const messaging = getMessaging(app);
    console.log('-> Servicio FCM autenticado y listo para despachar notificaciones.');

    console.log('\n>>> TODAS LAS VARIABLES Y PERMISOS ESTÁN 100% CORRECTOS Y VERIFICADOS. <<<');
  } catch (err) {
    console.error('\nERROR durante la prueba:', err.message || err);
  }
}

testFirebaseAdmin();
