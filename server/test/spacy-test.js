
// Try to load spacy using different methods
let spacy = null;

try {
  // Try direct require
  const spacyModule = require('spacy-nlp');
  spacy = spacyModule.default || spacyModule;
  console.log('Loaded spaCy with direct require');
} catch (e) {
  console.log('Failed to load with direct require:', e.message);
  
  try {
    // Try requiring from node_modules directly
    const spacyPath = require.resolve('spacy-nlp', { paths: [
      path.join(__dirname, '..', 'node_modules'),
      path.join(__dirname, '..', '..', 'node_modules')
    ]});
    spacy = require(spacyPath).default || require(spacyPath);
    console.log('Loaded spaCy from resolved path:', spacyPath);
  } catch (e2) {
    console.log('Failed to load from node_modules path:', e2.message);
    console.log('SpaCy is not available, fallback extraction will be used.');
    process.exit(0);
  }
}

async function testSpacy() {
  if (!spacy) {
    console.log('SpaCy module not loaded, cannot run test.');
    return;
  }
  
  try {
    console.log('Loading spaCy model...');
    await spacy.load('en_core_web_sm');
    console.log('Model loaded successfully!');
    
    console.log('Testing entity extraction...');
    const result = await spacy.parse('Apple Inc. is based in Cupertino, California. CEO Tim Cook leads the company.');
    console.log('Entities found:', result.ents);
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSpacy();
