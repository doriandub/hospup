// Test d'upload frontend pour vérifier la connectivité
// À exécuter dans la console de https://hospup.vercel.app

console.log('🚀 TEST UPLOAD FRONTEND → BACKEND');

const API_URL = 'https://web-production-93a0d.up.railway.app';
const token = localStorage.getItem('access_token');

if (!token) {
  console.error('❌ Pas de token - se connecter d\'abord');
} else {
  console.log('✅ Token présent:', token.substring(0, 30) + '...');
  
  async function testUploadFlow() {
    try {
      // 1. Récupérer les propriétés
      console.log('🏠 Récupération des propriétés...');
      const propsResponse = await fetch(`${API_URL}/api/v1/properties/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const properties = await propsResponse.json();
      console.log('✅ Propriétés:', properties);
      
      if (properties.length === 0) {
        console.log('ℹ️ Aucune propriété - en créer une d\'abord');
        return;
      }
      
      const propertyId = properties[0].id;
      console.log('🏠 Utilisation propriété:', propertyId);
      
      // 2. Tester presigned URL
      console.log('📋 Test presigned URL...');
      const presignedResponse = await fetch(`${API_URL}/api/v1/upload/presigned-url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file_name: 'test.mp4',
          content_type: 'video/mp4',
          property_id: propertyId,
          file_size: 1000000
        })
      });
      
      if (presignedResponse.ok) {
        const presignedData = await presignedResponse.json();
        console.log('✅ Presigned URL générée avec succès');
        console.log('🔗 S3 Key:', presignedData.s3_key);
        console.log('🔗 Upload URL:', presignedData.upload_url);
      } else {
        console.error('❌ Presigned URL failed:', presignedResponse.status);
        const errorData = await presignedResponse.text();
        console.error('Error:', errorData);
      }
      
    } catch (error) {
      console.error('❌ Erreur test upload:', error);
    }
  }
  
  testUploadFlow();
}