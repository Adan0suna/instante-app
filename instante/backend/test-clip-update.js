// Script de prueba para verificar la actualización de clips
const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase (reemplaza con tus credenciales)
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClipUpdate() {
  try {
    // 1. Verificar si la tabla clips existe y tiene el campo clip_url
    console.log('🔍 Verificando estructura de la tabla clips...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('clips')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error accediendo a la tabla clips:', tableError);
      return;
    }
    
    console.log('✅ Tabla clips accesible');
    console.log('📊 Estructura de la tabla:', Object.keys(tableInfo[0] || {}));
    
    // 2. Verificar si hay clips existentes
    const { data: clips, error: clipsError } = await supabase
      .from('clips')
      .select('*')
      .limit(5);
    
    if (clipsError) {
      console.error('❌ Error obteniendo clips:', clipsError);
      return;
    }
    
    console.log('📋 Clips existentes:', clips.length);
    clips.forEach(clip => {
      console.log(`  - ID: ${clip.id}, Description: ${clip.description}, clip_url: ${clip.clip_url || 'NULL'}`);
    });
    
    // 3. Intentar actualizar un clip con clip_url
    if (clips.length > 0) {
      const testClip = clips[0];
      const testUrl = `/recortes/file/test_${Date.now()}`;
      
      console.log(`🔄 Actualizando clip ${testClip.id} con URL: ${testUrl}`);
      
      const { data: updatedClip, error: updateError } = await supabase
        .from('clips')
        .update({ clip_url: testUrl })
        .eq('id', testClip.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error actualizando clip:', updateError);
        return;
      }
      
      console.log('✅ Clip actualizado exitosamente:', updatedClip);
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testClipUpdate();
