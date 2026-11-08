export function completeGiftIdeas(person, saved = []) {
  const text = `${person.likes || ''} ${person.wish || ''}`.toLocaleLowerCase('es');
  const age = Number.parseInt(person.age, 10);
  let toys = ['Kit de colores lavables y bloc de dibujo', 'Rompecabezas acorde con su edad'];
  if (age < 3) toys = ['Bloques grandes para apilar, según su edad', 'Libro de tela o cartón grueso'];
  else if (/carro|transmilenio|sitp|taxi/.test(text)) toys = ['Set de carritos de colección', 'Pista de carros con un vehículo'];
  else if (/avion|avión/.test(text)) toys = ['Avión de juguete con ruedas', 'Kit para armar un avión, según su edad'];
  else if (/harry potter/.test(text)) toys = ['Rompecabezas de Harry Potter', 'Juego de mesa de Harry Potter'];
  else if (/poni|pony/.test(text)) toys = ['Figura de pony con accesorios', 'Colores y bloc de dibujo'];
  else if (/muñeca/.test(text)) toys = ['Muñeca con ropa y accesorios', 'Kit de colores y bloc de dibujo'];
  else if (/peluche/.test(text)) toys = ['Peluche de perrito, gato o conejo', 'Kit de colores y bloc de dibujo'];
  const size = person.size && !/confirmar/i.test(person.size) ? ` · talla ${person.size}` : '';
  const fallback = [...toys, `Camiseta y pantalón cómodos${size}`].map(title => ({title}));
  const valid = (Array.isArray(saved) ? saved : []).filter(i => i && typeof i.title === 'string' && i.title.trim());
  const unique = new Set();
  return [...valid, ...fallback].filter(i => {
    const key = i.title.trim().toLocaleLowerCase('es');
    if (unique.has(key)) return false;
    unique.add(key);
    return true;
  }).slice(0, 3);
}
