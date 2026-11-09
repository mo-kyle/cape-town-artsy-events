// Taxonomy and tuning knobs for what counts as an "artsy" event: hands-on
// classes and workshops, plus things to go and see — exhibitions, tastings,
// festivals and markets.
// Keywords are matched case-insensitively on word boundaries; spaces match
// spaces or hyphens; simple plurals are allowed.

export const TIMEZONE = 'Africa/Johannesburg';

export const CATEGORIES = [
  {
    id: 'pottery',
    label: 'Pottery & ceramics',
    emoji: '🏺',
    keywords: [
      'pottery', 'ceramic', 'ceramics', 'clay', 'wheel throwing', 'wheel-thrown', 'hand building',
      'handbuilding', 'glazing', 'kiln', 'pinch pot', 'slab building', 'raku', 'porcelain', 'stoneware',
      'ceramic painting', 'pottery painting', 'paint your own pottery', 'clay sculpting',
    ],
  },
  {
    id: 'cooking',
    label: 'Cooking & baking',
    emoji: '🍳',
    keywords: [
      'cooking class', 'cooking course', 'cooking workshop', 'cooking lesson', 'cooking experience', 'cookery',
      'cook-along', 'cook along', 'culinary class', 'culinary workshop', 'culinary course', 'culinary school', 'baking class', 'baking workshop', 'baking course', 'bake-along',
      'bread making', 'bread baking', 'sourdough', 'pasta making', 'pasta class', 'pasta workshop', 'sushi making',
      'sushi class', 'sushi workshop', 'dumpling', 'dim sum class', 'pastry class', 'pastry workshop', 'patisserie',
      'chocolate making', 'chocolate workshop', 'chocolate masterclass', 'cheese making', 'cheesemaking',
      'butter making', 'fermentation', 'fermenting', 'kombucha', 'kimchi', 'pickling', 'preserving', 'cake decorating',
      'cupcake decorating', 'cupcakes', 'cookie decorating', 'cookies decorating', 'biscuit decorating', 'gingerbread', 'macaron', 'macarons', 'curry class', 'curry cooking', 'pizza making',
      'cocktail class', 'cocktail making', 'cocktail workshop', 'mixology', 'gin making', 'gin blending',
      'barista course', 'barista class', 'coffee workshop', 'latte art', 'wine blending', 'blend your own',
      'tapas class', 'thai cooking', 'italian cooking', 'indian cooking', 'cape malay cooking', 'plant-based cooking',
      'vegan cooking', 'knife skills',
    ],
  },
  {
    id: 'scent',
    label: 'Aromatherapy & scent',
    emoji: '🌿',
    keywords: [
      'aromatherapy', 'aromatherapist', 'essential oil', 'essential oils', 'incense', 'incense making',
      'perfume', 'perfumery', 'perfume making', 'fragrance', 'scent', 'scented', 'room spray', 'natural remedies',
      'herbal remedy', 'herbal remedies', 'herbalism', 'herbalist', 'apothecary', 'botanical skincare',
      'skincare making', 'natural skincare', 'balm making', 'salve', 'smudge', 'smudge stick',
    ],
  },
  {
    id: 'candles-soap',
    label: 'Candles & soap',
    emoji: '🕯️',
    keywords: [
      'candle making', 'candle-making', 'candle workshop', 'candle pouring', 'candle class', 'soy candle',
      'soy wax', 'soap making', 'soap-making', 'soap workshop', 'bath bomb', 'bath bombs', 'wax melts', 'wax sealing',
    ],
  },
  {
    id: 'painting',
    label: 'Painting & drawing',
    emoji: '🎨',
    keywords: [
      'sip and paint', 'sip & paint', 'sip n paint', "sip 'n paint", 'paint and sip', 'paint & sip', 'paint night',
      'paint party', 'paint pouring', 'acrylic pour', 'acrylic pouring', 'fluid art', 'watercolour', 'watercolor',
      'acrylic painting', 'oil painting', 'life drawing', 'figure drawing', 'drawing class', 'drawing workshop',
      'sketching', 'sketch class', 'urban sketching', 'urban sketchers', 'art class', 'art classes', 'art workshop',
      'art course', 'painting class', 'painting workshop', 'painting course', 'illustration workshop',
      'illustration class', 'rock painting', 'paint your own', 'gouache', 'pastel workshop', 'mural workshop',
      'art jamming', 'art jam', 'brush and brew', 'brush & brew', 'wine and paint', 'wine & paint', 'paint along',
      'portrait painting', 'landscape painting', 'botanical painting', 'botanical illustration', 'canvas painting',
      'paint and wine', 'shades & sips', 'shades and sips',
    ],
  },
  {
    id: 'textiles',
    label: 'Textiles & fibre',
    emoji: '🧶',
    keywords: [
      'weaving', 'weave', 'loom', 'macrame', 'macramé', 'knitting', 'knit', 'crochet', 'crocheting', 'embroidery',
      'embroider', 'cross stitch', 'cross-stitch', 'sewing', 'sewing class', 'dressmaking', 'pattern making',
      'quilting', 'quilt', 'tufting', 'rug making', 'rug tufting', 'felting', 'needle felting', 'wet felting',
      'natural dye', 'natural dyeing', 'indigo dye', 'indigo dyeing', 'shibori', 'tie dye', 'tie-dye', 'batik',
      'spinning wool', 'tapestry', 'punch needle', 'upcycling', 'visible mending', 'mending', 'darning',
      'textile workshop', 'textile art', 'fibre art', 'fiber art', 'yarn',
    ],
  },
  {
    id: 'jewellery',
    label: 'Jewellery & resin',
    emoji: '💍',
    keywords: [
      'jewellery making', 'jewelry making', 'jewellery workshop', 'jewelry workshop', 'jewellery class',
      'jewelry class', 'jewellery design', 'silversmith', 'silversmithing', 'ring making', 'make your own ring',
      'beading', 'bead workshop', 'beadwork', 'resin art', 'resin workshop', 'resin craft', 'resin crafting',
      'uv resin', 'wire wrapping', 'wire-wrapping', 'enamelling', 'enameling', 'metalsmith', 'goldsmith', 'charm making',
    ],
  },
  {
    id: 'paper',
    label: 'Paper, print & lettering',
    emoji: '✍️',
    keywords: [
      'calligraphy', 'hand lettering', 'hand-lettering', 'brush lettering', 'lettering workshop', 'bookbinding',
      'book binding', 'printmaking', 'print making', 'linocut', 'lino print', 'lino cut', 'lino printing',
      'screen printing', 'screenprinting', 'screen print', 'letterpress', 'journaling workshop', 'art journal',
      'art journaling', 'collage workshop', 'collage class', 'paper craft', 'papercraft', 'paper making', 'papermaking',
      'origami', 'zine', 'zine making', 'block printing', 'cyanotype', 'risograph', 'stamp carving', 'scrapbooking',
      'creative writing workshop', 'poetry workshop',
    ],
  },
  {
    id: 'floral',
    label: 'Floral & botanical',
    emoji: '💐',
    keywords: [
      'flower arranging', 'floral arranging', 'floral design', 'floristry', 'florist workshop', 'flower workshop',
      'flower crown', 'wreath making', 'wreath workshop', 'terrarium', 'kokedama', 'bonsai', 'ikebana',
      'dried flower', 'dried flowers', 'pressed flower', 'pressed flowers', 'flower pressing', 'foraging', 'forage',
      'wild food', 'plant workshop', 'propagation workshop', 'succulent', 'succulents', 'gardening workshop',
      'herb garden', 'mushroom growing', 'mushroom cultivation', 'grow your own', 'bouquet',
    ],
  },
  {
    id: 'craft',
    label: 'Craft & making',
    emoji: '🛠️',
    keywords: [
      'craft workshop', 'crafting', 'craft social', 'craft night', 'craft class', 'craft evening', 'craft session',
      'craft circle', 'diy workshop', 'diy class', 'maker workshop', 'makers workshop', 'woodwork', 'woodworking',
      'wood carving', 'woodcarving', 'whittling', 'spoon carving', 'leatherwork', 'leather craft', 'leather workshop',
      'leather making', 'glass blowing', 'glassblowing', 'fused glass', 'glass fusing', 'stained glass', 'glass art',
      'mosaic', 'mosaics', 'basket weaving', 'basketry', 'basket making', 'lampshade making', 'furniture making',
      'upholstery', 'blacksmith', 'blacksmithing', 'forging', 'knife making', 'sculpture workshop', 'sculpting',
      'model making', 'puppet making', 'mask making', 'lantern making', 'kite making', 'ceramic workshop',
      'make your own', 'make-your-own', 'handmade', 'hand made', 'creative workshop', 'creative class', 'art and craft',
      'arts and crafts', 'arts & crafts', 'crafternoon', 'kintsugi', 'polymer clay', 'air dry clay', 'air-dry clay',
    ],
  },
  {
    id: 'wellness',
    label: 'Wellness & ritual',
    emoji: '🧘',
    keywords: [
      'sound bath', 'sound healing', 'sound journey', 'gong bath', 'breathwork', 'cacao ceremony', 'reiki',
      'crystal workshop', 'crystal healing', 'meditation workshop', 'guided meditation', 'mindfulness workshop',
      'yoga workshop', 'yin yoga', 'restorative yoga', 'ecstatic dance', 'full moon', 'new moon', "women's circle",
      'womens circle', 'tea ceremony', 'tea tasting', 'ayurveda', 'self-care workshop', 'self care workshop',
      'journaling circle', 'vision board', 'intention setting', 'kirtan', 'yoga nidra', 'forest bathing',
    ],
  },
  {
    id: 'exhibitions',
    label: 'Museums & galleries',
    emoji: '🖼️',
    keywords: [
      'exhibition', 'exhibitions', 'art exhibition', 'solo exhibition', 'group exhibition', 'group show', 'solo show',
      'art show', 'gallery', 'galleries', 'art gallery', 'museum', 'museums', 'vernissage', 'opening night',
      'exhibition opening', 'gallery opening', 'walkabout', 'walk-about', 'curator talk', "curator's talk", 'artist talk',
      "artist's talk", 'artists talk', 'artist walkabout', 'first thursdays', 'first thursday', 'art fair', 'art week',
      'sculpture garden', 'retrospective', 'installation', 'photography exhibition', 'photographic exhibition',
      'biennale', 'open studios', 'studio tour', 'art tour', 'art walk', 'heritage tour', 'heritage site', 'planetarium',
      'aquarium', 'zeitz mocaa', 'norval foundation', 'iziko', 'irma stern', 'district six museum',
      'contemporary art', 'fine art', 'ceramics exhibition', 'design indaba',
    ],
  },
  {
    id: 'tastings',
    label: 'Wine & tastings',
    emoji: '🍷',
    keywords: [
      'wine tasting', 'wine tastings', 'wine pairing', 'wine and food pairing', 'food and wine pairing', 'wine estate',
      'wine farm', 'cellar tour', 'cellar tours', 'cellar door', 'vineyard', 'vineyards', 'harvest festival',
      'winemaker', 'wine dinner', 'wine evening', 'wine club', 'wine walk', 'wine route', 'wine tram', 'wine safari',
      'bubbly', 'mcc tasting', 'cap classique', 'champagne tasting', 'sparkling wine', 'gin tasting', 'gin pairing',
      'gin experience', 'whisky tasting', 'whiskey tasting', 'rum tasting', 'brandy tasting', 'tequila tasting',
      'mezcal tasting', 'beer tasting', 'craft beer', 'brewery tour', 'brewery tours', 'beer pairing', 'cider tasting',
      'cheese tasting', 'cheese and wine', 'wine and cheese', 'chocolate tasting', 'chocolate pairing',
      'chocolate and wine', 'olive oil tasting', 'olive tasting', 'coffee tasting', 'coffee cupping', 'cupping',
      'tea tasting', 'honey tasting', 'oyster tasting', 'oysters and bubbly', 'food pairing', 'pairing experience',
      'tasting menu', 'tasting experience', 'tasting evening', 'tasting event', 'tasting room', 'tasting',
      'tastings', 'degustation', 'sommelier', 'blind tasting', 'wine masterclass', 'gin masterclass',
      'whisky masterclass', 'cocktail tasting', 'spirits tasting', 'distillery tour', 'distillery',
    ],
  },
  {
    id: 'festivals',
    label: 'Festivals & markets',
    emoji: '🎪',
    keywords: [
      'festival', 'festivals', 'fest', 'fete', 'fête', 'carnival', 'street party', 'street festival', 'food festival',
      'wine festival', 'beer festival', 'gin festival', 'arts festival', 'art festival', 'craft festival',
      'design festival', 'film festival', 'book festival', 'literary festival', 'jazz festival', 'music festival',
      'kite festival', 'flower festival', 'lantern festival', 'light festival', 'festival of lights', 'night market',
      'market', 'markets', 'craft market', 'makers market', "makers' market", 'artisan market', 'food market',
      'farmers market', "farmers' market", 'christmas market', 'festive market', 'night fair',
      'design fair', 'craft fair', 'pop-up', 'pop up market', 'popup market', 'open-air', 'open air',
      'summer concert series', 'carols by candlelight', 'fair', 'fayre', 'expo', 'show day',
    ],
  },
];

// Words that suggest you *do* something rather than watch it.
export const HANDS_ON = [
  'workshop', 'workshops', 'class', 'classes', 'masterclass', 'course', 'lesson', 'lessons', 'make your own',
  'make-your-own', 'hands-on', 'hands on', 'learn to', 'learn how', 'beginner', 'beginners', 'introduction to',
  'intro to', 'taster', 'tutorial', 'make & take', 'make and take', 'diy', 'create your own', 'build your own',
  'experience', 'session', 'sessions', 'studio', 'all materials', 'materials included', 'no experience',
  'step-by-step', 'step by step', 'guided', 'you will make', "you'll make", 'take home', 'take-home',
];

// A title hit on any of these drops the event outright.
export const HARD_NEGATIVE = [
  'conference', 'webinar', 'summit', 'networking', 'job fair', 'career fair', 'hackathon', 'bootcamp',
  'worship', 'sermon', 'bible', 'prayer', 'church service', 'crusade', 'revival',
  'kickboxing', 'self defense', 'self-defense', 'self defence', 'self-defence', 'boxing', 'mma', 'rugby', 'cricket',
  'football', 'soccer', 'golf day', 'marathon', 'trail run', 'fun run', 'parkrun', 'cycle tour', 'triathlon',
  'comedy', 'stand-up', 'stand up comedy', 'improv', 'orchestra', 'symphony', 'philharmonic', 'classical music',
  'live music', 'dj set', 'album launch', 'tribute show', 'tribute band', 'concert', 'makeup', 'make-up', 'lashes', 'nail tech', 'hair styling', 'barber',
  'web3', 'blockchain', 'crypto', 'bitcoin', 'artificial intelligence', 'a.i.', 'chatgpt', 'software', 'coding',
  'python', 'javascript', 'excel', 'power bi', 'marketing', 'sales training', 'leadership', 'entrepreneur',
  'property investment', 'forex', 'trading', 'real estate', 'insurance', 'tax', 'bookkeeping', 'cv writing',
  'safari', 'cruise', 'boat trip', 'bus tour', 'day tour', 'shuttle',
  'quiz night', 'trivia', 'bingo', 'poker', 'karaoke', 'speed dating', 'singles', 'matric', 'school holiday camp',
  'exam', 'first aid', 'cpr', 'driving', 'firearm', 'shooting range', 'hunting', 'fishing',
  'rope class', 'shibari', 'kink', 'burlesque', 'lingerie', 'strip', 'pole dance',
  'gift card', 'gift voucher', 'voucher', 'high tea', 'roundtable', 'self-guided', 'test event', 'sold out',
  'membership', 'memberships', 'memorial run', 'tech festival', 'tech expo', 'padel', 'tennis', 'netball', 'hockey',
  'squash', 'the musical', 'pleasure toys', 'sex toys', 'adult toys',
];

// Softer penalties: lower the score but don't exclude on their own.
export const SOFT_NEGATIVE = [
  'screening', 'film', 'lecture', 'panel', 'seminar', 'meeting', 'agm', 'fundraiser', 'gala', 'dinner', 'brunch',
  'lunch', 'party', 'birthday', 'year-end', 'year end', 'festive', 'christmas lunch', 'sunset', 'picnic', 'hike',
  'walk', 'retreat', 'launch', 'competition', 'awards', 'ceremony', 'graduation', 'kids party', 'teambuilding',
  'team building', 'team-building', 'corporate',
];

// Scoring: include when score >= MIN_SCORE and at least one category hit.
export const MIN_SCORE = 3;

// Geographic areas inside the Western Cape; the city field (or address text) is matched against these.
export const AREAS = [
  {
    id: 'cape-town',
    label: 'Cape Town',
    places: [
      'cape town', 'kaapstad', 'woodstock', 'observatory', 'salt river', 'sea point', 'green point', 'mouille point',
      'de waterkant', 'gardens', 'tamboerskloof', 'oranjezicht', 'vredehoek', 'bo-kaap', 'v&a waterfront', 'waterfront',
      'camps bay', 'clifton', 'bantry bay', 'hout bay', 'llandudno', 'noordhoek', 'kommetjie', 'scarborough', 'fish hoek',
      'kalk bay', 'st james', 'muizenberg', 'lakeside', 'simon\'s town', 'simons town', 'tokai', 'bergvliet', 'constantia',
      'wynberg', 'plumstead', 'kenilworth', 'claremont', 'newlands', 'rondebosch', 'rosebank', 'mowbray', 'pinelands',
      'thornton', 'maitland', 'milnerton', 'table view', 'tableview', 'blouberg', 'bloubergstrand', 'big bay', 'melkbosstrand',
      'parklands', 'sunningdale', 'century city', 'goodwood', 'parow', 'bellville', 'durbanville', 'brackenfell',
      'kuils river', 'kuilsrivier', 'kraaifontein', 'somerset west', 'strand', 'gordon\'s bay', 'gordons bay', 'stellenbosch road',
      'ottery', 'lansdowne', 'athlone', 'rylands', 'grassy park', 'retreat', 'steenberg', 'philippi', 'khayelitsha',
      'mitchells plain', 'mitchell\'s plain', 'gugulethu', 'langa', 'nyanga', 'delft', 'blue downs', 'eersterivier',
      'eerste river', 'wetton', 'diep river', 'harfield', 'lynfrae', 'zonnebloem', 'district six', 'foreshore', 'cbd',
      'city bowl', 'southern suburbs', 'northern suburbs', 'atlantic seaboard', 'west coast road', 'philadelphia', 'ndabeni',
      'epping', 'paarden eiland', 'tygervalley', 'tyger valley', 'welgemoed', 'plattekloof', 'edgemead', 'bothasig',
    ],
  },
  {
    id: 'winelands',
    label: 'Winelands',
    places: [
      'stellenbosch', 'paarl', 'franschhoek', 'wellington', 'klapmuts', 'simondium', 'pniel', 'groot drakenstein',
      'tulbagh', 'wolseley', 'ceres', 'worcester', 'rawsonville', 'robertson', 'mcgregor', 'montagu', 'bonnievale',
      'elgin', 'grabouw', 'botrivier', 'bot river', 'villiersdorp', 'riebeek kasteel', 'riebeek-kasteel', 'riebeek west',
      'malmesbury', 'durbanville hills', 'philadelphia',
    ],
  },
  {
    id: 'western-cape',
    label: 'Rest of Western Cape',
    places: [
      'hermanus', 'onrus', 'gansbaai', 'kleinmond', 'betty\'s bay', 'bettys bay', 'pringle bay', 'rooi els', 'stanford',
      'darling', 'yzerfontein', 'langebaan', 'paternoster', 'saldanha', 'velddrif', 'piketberg', 'citrusdal', 'clanwilliam',
      'lamberts bay', 'swellendam', 'barrydale', 'greyton', 'genadendal', 'caledon', 'napier', 'bredasdorp', 'arniston',
      'struisbaai', 'l\'agulhas', 'agulhas', 'witsand', 'stilbaai', 'still bay', 'mossel bay', 'george', 'wilderness',
      'sedgefield', 'knysna', 'plettenberg bay', 'plett', 'nature\'s valley', 'oudtshoorn', 'prince albert', 'ladismith',
      'calitzdorp', 'de rust', 'riversdale', 'heidelberg', 'western cape',
    ],
  },
];
