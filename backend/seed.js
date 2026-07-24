const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

if (process.env.ALLOW_DEMO_SEED !== 'true' || process.env.NODE_ENV === 'production') {
  throw new Error('Demo seed is quarantined; set ALLOW_DEMO_SEED=true outside production');
}
if (!process.env.DEMO_SEED_PASSWORD || process.env.DEMO_SEED_PASSWORD.length < 12) {
  throw new Error('DEMO_SEED_PASSWORD must contain at least 12 characters');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  step: (msg) => console.log(`\x1b[35m[STEP]\x1b[0m ${msg}`),
  done: (msg) => console.log(`\x1b[32m\x1b[1m[DONE]\x1b[0m ${msg}`),
};

async function seed() {
  const client = await pool.connect();

  try {
    log.info('Starting database seed...');
    log.step('Dropping existing tables...');

    await client.query(`
      DROP TABLE IF EXISTS ai_generations CASCADE;
      DROP TABLE IF EXISTS memory_tags CASCADE;
      DROP TABLE IF EXISTS milestones CASCADE;
      DROP TABLE IF EXISTS memories CASCADE;
      DROP TABLE IF EXISTS tags CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS memory_books CASCADE;
      DROP TABLE IF EXISTS templates CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    log.success('All existing tables dropped.');

    // ── Create Tables ────────────────────────────────────────────────
    log.step('Creating tables...');

    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE memory_books (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        cover_color VARCHAR(7) DEFAULT '#6366f1',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(7) DEFAULT '#6366f1',
        icon VARCHAR(50) DEFAULT '📁',
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE memories (
        id SERIAL PRIMARY KEY,
        book_id INTEGER REFERENCES memory_books(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        memory_date DATE,
        location VARCHAR(255),
        emotion VARCHAR(50),
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        image_url TEXT,
        is_favorite BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE tags (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(7) DEFAULT '#6366f1',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE memory_tags (
        memory_id INTEGER REFERENCES memories(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (memory_id, tag_id)
      );

      CREATE TABLE milestones (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        milestone_date DATE,
        icon VARCHAR(50) DEFAULT '⭐',
        memory_id INTEGER REFERENCES memories(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        structure JSONB,
        category VARCHAR(100),
        is_default BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE ai_generations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        input_text TEXT,
        output_text TEXT,
        memory_id INTEGER REFERENCES memories(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    log.success('All tables created successfully.');

    // ── Seed Demo User ───────────────────────────────────────────────
    log.step('Creating demo user...');
    const demoEmail = process.env.DEMO_EMAIL || 'runtime-admin@example.com';
    const hashedPassword = bcrypt.hashSync(process.env.DEMO_SEED_PASSWORD, 10);
    const userResult = await client.query(
      `INSERT INTO users (email, password, name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id`,
      [demoEmail, hashedPassword, 'Runtime Admin', null]
    );
    const userId = userResult.rows[0].id;
    log.success(`Demo user created (id: ${userId}) for ${demoEmail}`);

    // ── Seed Memory Books ────────────────────────────────────────────
    log.step('Creating 15 memory books...');
    const books = [
      { title: 'Childhood Adventures', description: 'Precious moments from growing up, filled with wonder and discovery.', color: '#ef4444' },
      { title: 'Travel Diaries 2024', description: 'Journeys to new places, cultures, and unforgettable experiences.', color: '#f97316' },
      { title: 'Family Gatherings', description: 'Heartwarming moments with loved ones at family events.', color: '#eab308' },
      { title: 'College Memories', description: 'Late-night study sessions, friendships, and campus life.', color: '#22c55e' },
      { title: 'Wedding Day', description: 'The most magical day, captured in every detail.', color: '#ec4899' },
      { title: 'First Home', description: 'The excitement of moving in and making it our own.', color: '#8b5cf6' },
      { title: 'Pet Stories', description: 'Adventures and cuddles with our furry friends.', color: '#f59e0b' },
      { title: 'Holiday Traditions', description: 'Annual celebrations that bring the family together.', color: '#14b8a6' },
      { title: 'Career Milestones', description: 'Professional achievements and workplace memories.', color: '#3b82f6' },
      { title: 'Friendship Tales', description: 'Stories of bonds that have stood the test of time.', color: '#a855f7' },
      { title: 'Nature Walks', description: 'Peaceful moments spent exploring the great outdoors.', color: '#10b981' },
      { title: 'Cooking Adventures', description: 'Kitchen experiments, family recipes, and delicious memories.', color: '#f43f5e' },
      { title: 'Music Memories', description: 'Concerts, playlists, and songs that defined moments.', color: '#6366f1' },
      { title: 'Sports Highlights', description: 'Victories, defeats, and the thrill of competition.', color: '#0ea5e9' },
      { title: 'Garden Journal', description: 'Watching seeds grow into beautiful blooms and harvests.', color: '#84cc16' },
    ];

    const bookIds = [];
    for (const book of books) {
      const result = await client.query(
        'INSERT INTO memory_books (user_id, title, description, cover_color) VALUES ($1, $2, $3, $4) RETURNING id',
        [userId, book.title, book.description, book.color]
      );
      bookIds.push(result.rows[0].id);
    }
    log.success(`15 memory books created (ids: ${bookIds.join(', ')})`);

    // ── Seed Categories ──────────────────────────────────────────────
    log.step('Creating 15 categories...');
    const categories = [
      { name: 'Family', color: '#ef4444', icon: '👨‍👩‍👧‍👦', description: 'Moments with family members' },
      { name: 'Travel', color: '#f97316', icon: '✈️', description: 'Adventures and journeys' },
      { name: 'Friends', color: '#eab308', icon: '👫', description: 'Time spent with friends' },
      { name: 'Celebrations', color: '#22c55e', icon: '🎉', description: 'Parties, birthdays, and special events' },
      { name: 'Achievements', color: '#3b82f6', icon: '🏆', description: 'Personal and professional wins' },
      { name: 'Nature', color: '#10b981', icon: '🌿', description: 'Outdoor and nature experiences' },
      { name: 'Food', color: '#f43f5e', icon: '🍕', description: 'Culinary experiences and recipes' },
      { name: 'Music', color: '#8b5cf6', icon: '🎵', description: 'Musical moments and concerts' },
      { name: 'Sports', color: '#0ea5e9', icon: '⚽', description: 'Athletic activities and events' },
      { name: 'Pets', color: '#f59e0b', icon: '🐾', description: 'Moments with beloved pets' },
      { name: 'Holidays', color: '#14b8a6', icon: '🎄', description: 'Holiday celebrations and traditions' },
      { name: 'School', color: '#a855f7', icon: '📚', description: 'School and education memories' },
      { name: 'Work', color: '#6366f1', icon: '💼', description: 'Workplace experiences' },
      { name: 'Health', color: '#ec4899', icon: '💪', description: 'Fitness and wellness milestones' },
      { name: 'Hobbies', color: '#84cc16', icon: '🎨', description: 'Creative pursuits and hobbies' },
    ];

    const categoryIds = [];
    for (const cat of categories) {
      const result = await client.query(
        'INSERT INTO categories (user_id, name, color, icon, description) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [userId, cat.name, cat.color, cat.icon, cat.description]
      );
      categoryIds.push(result.rows[0].id);
    }
    log.success(`15 categories created (ids: ${categoryIds.join(', ')})`);

    // ── Seed Memories ────────────────────────────────────────────────
    log.step('Creating 15+ memories...');
    const memoriesData = [
      { bookIdx: 0, title: 'Building a Tree Fort', content: 'We spent the entire summer building a tree fort in the backyard with Dad. The wood was rough and we got splinters, but the pride of sitting up there watching the sunset made it all worthwhile. That fort became our secret hideaway for years.', date: '2005-07-15', location: 'Backyard, Hometown', emotion: 'nostalgic', catIdx: 0, favorite: true },
      { bookIdx: 1, title: 'Sunrise in Santorini', content: 'Waking up at 5 AM to watch the sunrise over the caldera was absolutely breathtaking. The sky turned shades of pink and gold as the sun crept over the Aegean Sea. We sipped Greek coffee on our balcony and felt like time had stopped.', date: '2024-06-20', location: 'Santorini, Greece', emotion: 'peaceful', catIdx: 1, favorite: true },
      { bookIdx: 2, title: 'Grandma\'s 80th Birthday', content: 'The whole family flew in from across the country for Grandma\'s surprise 80th birthday party. Her face when she walked in and saw everyone was priceless. She cried happy tears and hugged each of us for what felt like forever.', date: '2024-03-12', location: 'Grandma\'s House, Ohio', emotion: 'heartwarming', catIdx: 3, favorite: true },
      { bookIdx: 3, title: 'All-Night Study Session', content: 'The night before finals, our entire study group camped out in the library with mountains of coffee and textbooks. We quizzed each other until 3 AM, laughing through the exhaustion. Somehow we all passed with flying colors.', date: '2019-12-15', location: 'University Library', emotion: 'funny', catIdx: 11, favorite: false },
      { bookIdx: 4, title: 'The First Dance', content: 'Our first dance as a married couple to "At Last" by Etta James was pure magic. Everything else faded away and it was just the two of us swaying under the string lights. I remember thinking this was the happiest moment of my life.', date: '2023-09-22', location: 'Rose Garden Venue', emotion: 'romantic', catIdx: 3, favorite: true },
      { bookIdx: 5, title: 'Moving Day Chaos', content: 'The moving truck was too small, the couch got stuck in the doorway, and we ordered pizza three times. Despite all the chaos, collapsing on the living room floor of our very first home was the best feeling in the world.', date: '2024-01-15', location: 'Our First Home', emotion: 'excited', catIdx: 0, favorite: false },
      { bookIdx: 6, title: 'Adopting Max', content: 'The moment Max looked up at us from the shelter kennel with those big brown eyes, we knew he was ours. He was timid at first but within an hour of being home, he was running around the yard with his tail wagging like crazy.', date: '2023-04-10', location: 'City Animal Shelter', emotion: 'joyful', catIdx: 9, favorite: true },
      { bookIdx: 7, title: 'Christmas Morning Snow', content: 'We woke up to a perfect blanket of fresh snow on Christmas morning. The kids ran outside in their pajamas to make snow angels before even opening presents. Hot cocoa never tasted better than it did that morning.', date: '2024-12-25', location: 'Home', emotion: 'magical', catIdx: 10, favorite: true },
      { bookIdx: 8, title: 'The Big Promotion', content: 'After three years of hard work and dedication, I finally got promoted to Senior Director. My team surprised me with a cake and a card signed by everyone. The pride in my family\'s eyes at dinner that night meant more than the title.', date: '2024-08-05', location: 'Downtown Office', emotion: 'proud', catIdx: 12, favorite: true },
      { bookIdx: 9, title: 'Reunion After 10 Years', content: 'Meeting my best friend from high school after a decade apart felt like no time had passed at all. We picked up right where we left off, finishing each other\'s sentences and laughing at old inside jokes.', date: '2024-05-18', location: 'Downtown Cafe', emotion: 'happy', catIdx: 2, favorite: false },
      { bookIdx: 10, title: 'Misty Mountain Hike', content: 'The trail was shrouded in morning mist, making every step feel like walking through a dream. When we reached the summit and the clouds parted to reveal the valley below, it took our breath away. Nature\'s reward for the climb.', date: '2024-09-14', location: 'Blue Ridge Mountains', emotion: 'awestruck', catIdx: 5, favorite: true },
      { bookIdx: 11, title: 'Grandma\'s Secret Recipe', content: 'Grandma finally shared her legendary apple pie recipe with me, but the secret ingredient was love and patience, she said. We spent the whole afternoon baking together, flour on our noses, laughing at my terrible crust-crimping skills.', date: '2024-02-28', location: 'Grandma\'s Kitchen', emotion: 'grateful', catIdx: 6, favorite: true },
      { bookIdx: 12, title: 'First Concert Ever', content: 'Standing in the crowd at my first live concert, feeling the bass vibrate through my chest, I understood why people love live music. The energy was electric and when the band played my favorite song, I sang every word at the top of my lungs.', date: '2018-07-22', location: 'City Arena', emotion: 'excited', catIdx: 7, favorite: false },
      { bookIdx: 13, title: 'Winning the Championship', content: 'The final whistle blew and we erupted in celebration. Months of early morning practices and grueling workouts had paid off. Lifting that trophy with my teammates is a moment I will carry with me forever.', date: '2024-11-10', location: 'City Stadium', emotion: 'triumphant', catIdx: 8, favorite: true },
      { bookIdx: 14, title: 'First Tomato Harvest', content: 'After weeks of careful watering and worrying, I picked my first ripe tomato from the garden. It was small and a little misshapen, but biting into it warm from the sun was one of the most satisfying things I have ever experienced.', date: '2024-08-20', location: 'Backyard Garden', emotion: 'proud', catIdx: 14, favorite: false },
      { bookIdx: 0, title: 'Catching Fireflies', content: 'Summer evenings spent chasing fireflies in the meadow behind our house were pure magic. We collected them in mason jars and used them as lanterns for our pretend camping trips in the living room.', date: '2004-06-30', location: 'Meadow, Hometown', emotion: 'magical', catIdx: 0, favorite: true },
    ];

    const memoryIds = [];
    for (const mem of memoriesData) {
      const result = await client.query(
        `INSERT INTO memories (book_id, user_id, title, content, memory_date, location, emotion, category_id, is_favorite)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [bookIds[mem.bookIdx], userId, mem.title, mem.content, mem.date, mem.location, mem.emotion, categoryIds[mem.catIdx], mem.favorite]
      );
      memoryIds.push(result.rows[0].id);
    }
    log.success(`${memoriesData.length} memories created (ids: ${memoryIds.join(', ')})`);

    // ── Seed Tags ────────────────────────────────────────────────────
    log.step('Creating 15 tags...');
    const tagsData = [
      { name: 'happy', color: '#fbbf24' },
      { name: 'nostalgic', color: '#a78bfa' },
      { name: 'funny', color: '#fb923c' },
      { name: 'heartwarming', color: '#f87171' },
      { name: 'adventurous', color: '#34d399' },
      { name: 'peaceful', color: '#93c5fd' },
      { name: 'exciting', color: '#f472b6' },
      { name: 'bittersweet', color: '#c084fc' },
      { name: 'proud', color: '#fcd34d' },
      { name: 'grateful', color: '#6ee7b7' },
      { name: 'inspiring', color: '#67e8f9' },
      { name: 'romantic', color: '#fb7185' },
      { name: 'playful', color: '#fdba74' },
      { name: 'reflective', color: '#a5b4fc' },
      { name: 'magical', color: '#d8b4fe' },
    ];

    const tagIds = [];
    for (const tag of tagsData) {
      const result = await client.query(
        'INSERT INTO tags (user_id, name, color) VALUES ($1, $2, $3) RETURNING id',
        [userId, tag.name, tag.color]
      );
      tagIds.push(result.rows[0].id);
    }
    log.success(`15 tags created (ids: ${tagIds.join(', ')})`);

    // ── Seed Memory-Tag Associations ─────────────────────────────────
    log.step('Associating tags with memories...');
    const memoryTagAssociations = [
      [0, [1, 12]],   // Building a Tree Fort: nostalgic, playful
      [1, [5, 14]],   // Sunrise in Santorini: peaceful, magical
      [2, [3, 0]],    // Grandma's 80th: heartwarming, happy
      [3, [2, 0]],    // All-Night Study: funny, happy
      [4, [11, 14]],  // First Dance: romantic, magical
      [5, [6, 2]],    // Moving Day: exciting, funny
      [6, [0, 3]],    // Adopting Max: happy, heartwarming
      [7, [14, 3]],   // Christmas Morning: magical, heartwarming
      [8, [8, 9]],    // Big Promotion: proud, grateful
      [9, [0, 1]],    // Reunion: happy, nostalgic
      [10, [5, 4]],   // Misty Mountain Hike: peaceful, adventurous
      [11, [9, 3]],   // Grandma's Recipe: grateful, heartwarming
      [12, [6, 0]],   // First Concert: exciting, happy
      [13, [8, 6]],   // Championship: proud, exciting
      [14, [8, 9]],   // First Tomato: proud, grateful
      [15, [14, 12]], // Catching Fireflies: magical, playful
    ];

    for (const [memIdx, tagIdxs] of memoryTagAssociations) {
      for (const tagIdx of tagIdxs) {
        await client.query(
          'INSERT INTO memory_tags (memory_id, tag_id) VALUES ($1, $2)',
          [memoryIds[memIdx], tagIds[tagIdx]]
        );
      }
    }
    log.success('Memory-tag associations created.');

    // ── Seed Milestones ──────────────────────────────────────────────
    log.step('Creating 15 milestones...');
    const milestonesData = [
      { title: 'First Steps', description: 'Took my very first steps as a toddler, wobbling across the living room into Mom\'s arms.', date: '1995-03-20', icon: '👶', memIdx: null },
      { title: 'Graduated High School', description: 'Walked across the stage to receive my diploma after four incredible years.', date: '2013-06-15', icon: '🎓', memIdx: null },
      { title: 'Got First Job', description: 'Landed my first real job and felt like a real adult for the first time.', date: '2014-09-01', icon: '💼', memIdx: null },
      { title: 'Learned to Drive', description: 'Finally passed the driving test on the second attempt and hit the open road.', date: '2012-08-10', icon: '🚗', memIdx: null },
      { title: 'First Solo Trip', description: 'Boarded a plane alone for the first time and discovered the joy of solo travel.', date: '2016-03-05', icon: '🌍', memIdx: 1 },
      { title: 'Got Married', description: 'Said "I do" to the love of my life surrounded by family and friends.', date: '2023-09-22', icon: '💍', memIdx: 4 },
      { title: 'Bought First Home', description: 'Signed the papers and got the keys to our very own home.', date: '2024-01-10', icon: '🏠', memIdx: 5 },
      { title: 'Had a Baby', description: 'Welcomed our beautiful baby into the world, a moment of pure love.', date: '2025-02-14', icon: '👼', memIdx: null },
      { title: 'Got Promoted', description: 'Received the promotion to Senior Director after years of dedication.', date: '2024-08-05', icon: '📈', memIdx: 8 },
      { title: 'Ran a Marathon', description: 'Crossed the finish line after 26.2 miles of determination and grit.', date: '2024-04-15', icon: '🏃', memIdx: null },
      { title: 'Published First Article', description: 'Saw my name in print for the first time as a published author.', date: '2020-11-20', icon: '📝', memIdx: null },
      { title: 'Learned to Cook', description: 'Mastered Grandma\'s apple pie recipe and found a love for cooking.', date: '2024-02-28', icon: '👨‍🍳', memIdx: 11 },
      { title: 'Made Best Friend', description: 'Met the person who would become my lifelong best friend.', date: '2008-09-05', icon: '🤝', memIdx: 9 },
      { title: 'First Pet', description: 'Brought home Max from the shelter and our family was complete.', date: '2023-04-10', icon: '🐕', memIdx: 6 },
      { title: 'Started a Garden', description: 'Planted the first seeds and discovered the joy of growing things.', date: '2024-04-01', icon: '🌱', memIdx: 14 },
    ];

    for (const ms of milestonesData) {
      await client.query(
        'INSERT INTO milestones (user_id, title, description, milestone_date, icon, memory_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, ms.title, ms.description, ms.date, ms.icon, ms.memIdx !== null ? memoryIds[ms.memIdx] : null]
      );
    }
    log.success('15 milestones created.');

    // ── Seed Templates ───────────────────────────────────────────────
    log.step('Creating 15 templates...');
    const templatesData = [
      {
        name: 'Birthday Celebration',
        description: 'Capture the joy of birthday celebrations with prompts for guests, gifts, and wishes.',
        category: 'Celebrations',
        structure: { sections: [{ title: 'The Birthday Person', prompts: ['Who is celebrating?', 'How old are they turning?'] }, { title: 'The Celebration', prompts: ['Where was the party held?', 'Who attended?', 'What was the theme?'] }, { title: 'Highlights', prompts: ['What was the best moment?', 'What gifts were given?', 'Describe the cake.'] }, { title: 'Wishes', prompts: ['What birthday wishes were made?', 'What does this birthday mean to you?'] }] }
      },
      {
        name: 'Wedding Day',
        description: 'Document every magical moment of a wedding day from preparation to reception.',
        category: 'Celebrations',
        structure: { sections: [{ title: 'Getting Ready', prompts: ['Describe the morning preparations.', 'How were you feeling?'] }, { title: 'The Ceremony', prompts: ['Describe the venue.', 'What were the vows?', 'Who officiated?'] }, { title: 'The Reception', prompts: ['Describe the first dance.', 'What was the best toast?', 'What was served?'] }, { title: 'Reflections', prompts: ['What was the most emotional moment?', 'What surprised you?'] }] }
      },
      {
        name: 'Travel Adventure',
        description: 'Record your travel experiences with detailed prompts for destinations and discoveries.',
        category: 'Travel',
        structure: { sections: [{ title: 'Destination', prompts: ['Where did you go?', 'How long was the trip?', 'Who traveled with you?'] }, { title: 'Experiences', prompts: ['What was the highlight?', 'Describe a local dish you tried.', 'What surprised you most?'] }, { title: 'People & Culture', prompts: ['Did you meet any interesting people?', 'What cultural differences did you notice?'] }, { title: 'Takeaways', prompts: ['What did you learn?', 'Would you go back?'] }] }
      },
      {
        name: 'Holiday Gathering',
        description: 'Preserve the warmth of holiday gatherings with family and friends.',
        category: 'Holidays',
        structure: { sections: [{ title: 'Setting', prompts: ['Which holiday?', 'Where was it celebrated?', 'Who was there?'] }, { title: 'Traditions', prompts: ['What traditions were followed?', 'Any new traditions started?'] }, { title: 'Food & Fun', prompts: ['What was on the menu?', 'What activities did you do?'] }, { title: 'Gratitude', prompts: ['What are you most grateful for?', 'Best moment of the gathering?'] }] }
      },
      {
        name: 'Achievement Unlocked',
        description: 'Celebrate personal and professional accomplishments.',
        category: 'Achievements',
        structure: { sections: [{ title: 'The Achievement', prompts: ['What did you accomplish?', 'When did it happen?'] }, { title: 'The Journey', prompts: ['How long did it take?', 'What challenges did you face?', 'Who helped you along the way?'] }, { title: 'The Moment', prompts: ['How did you find out?', 'What was your reaction?'] }, { title: 'Impact', prompts: ['How has this changed your life?', 'What did you learn?'] }] }
      },
      {
        name: 'Friendship Story',
        description: 'Celebrate the bonds of friendship and shared experiences.',
        category: 'Friends',
        structure: { sections: [{ title: 'The Friend', prompts: ['Who is your friend?', 'How did you meet?'] }, { title: 'Shared Moments', prompts: ['What is your favorite memory together?', 'What do you do for fun?'] }, { title: 'The Bond', prompts: ['What makes this friendship special?', 'How have you supported each other?'] }] }
      },
      {
        name: 'Nature Experience',
        description: 'Capture the beauty and peace of nature encounters.',
        category: 'Nature',
        structure: { sections: [{ title: 'The Setting', prompts: ['Where were you?', 'What time of day?', 'What was the weather?'] }, { title: 'Senses', prompts: ['What did you see?', 'What did you hear?', 'What did you smell?'] }, { title: 'Feelings', prompts: ['How did nature make you feel?', 'What thoughts crossed your mind?'] }] }
      },
      {
        name: 'Recipe Memory',
        description: 'Preserve recipes alongside the memories and stories behind them.',
        category: 'Food',
        structure: { sections: [{ title: 'The Dish', prompts: ['What was the dish?', 'Where did the recipe come from?'] }, { title: 'The Story', prompts: ['Who taught you this recipe?', 'When do you make it?'] }, { title: 'The Recipe', prompts: ['What are the ingredients?', 'Describe the process.', 'Any secret tips?'] }, { title: 'Memories', prompts: ['What memories does this dish evoke?', 'Who do you share it with?'] }] }
      },
      {
        name: 'Concert/Music Event',
        description: 'Relive the energy and emotion of live music experiences.',
        category: 'Music',
        structure: { sections: [{ title: 'The Event', prompts: ['Who performed?', 'Where was it?', 'Who went with you?'] }, { title: 'The Experience', prompts: ['What was the setlist highlight?', 'Describe the atmosphere.'] }, { title: 'The Feels', prompts: ['What song moved you most?', 'How did the music make you feel?'] }] }
      },
      {
        name: 'Sports Achievement',
        description: 'Document athletic accomplishments and competitive moments.',
        category: 'Sports',
        structure: { sections: [{ title: 'The Event', prompts: ['What sport?', 'What was the occasion?', 'Who was on your team?'] }, { title: 'The Competition', prompts: ['Describe the key moments.', 'What was the score or result?'] }, { title: 'Training', prompts: ['How did you prepare?', 'What sacrifices did you make?'] }, { title: 'Victory', prompts: ['How did you celebrate?', 'What did this mean to you?'] }] }
      },
      {
        name: 'Pet Memory',
        description: 'Cherish moments with beloved animal companions.',
        category: 'Pets',
        structure: { sections: [{ title: 'Your Pet', prompts: ['What is their name?', 'What kind of animal?', 'How did you get them?'] }, { title: 'Personality', prompts: ['What are their quirks?', 'What is their favorite thing?'] }, { title: 'Special Moments', prompts: ['Describe a funny moment.', 'What is your favorite memory with them?'] }] }
      },
      {
        name: 'First Experience',
        description: 'Capture the excitement and nervousness of doing something for the first time.',
        category: 'Milestones',
        structure: { sections: [{ title: 'The First', prompts: ['What was the first experience?', 'When did it happen?'] }, { title: 'Before', prompts: ['How did you feel beforehand?', 'How did you prepare?'] }, { title: 'During', prompts: ['What was it like?', 'What surprised you?'] }, { title: 'After', prompts: ['How did you feel afterward?', 'Would you do it again?'] }] }
      },
      {
        name: 'Seasonal Memory',
        description: 'Capture the essence of different seasons and their unique moments.',
        category: 'Nature',
        structure: { sections: [{ title: 'The Season', prompts: ['Which season?', 'What year?'] }, { title: 'Atmosphere', prompts: ['Describe the weather.', 'What colors dominated?', 'What scents were in the air?'] }, { title: 'Activities', prompts: ['What did you do?', 'Who were you with?'] }, { title: 'Feelings', prompts: ['What makes this season special to you?'] }] }
      },
      {
        name: 'Family Tradition',
        description: 'Document the traditions that make your family unique.',
        category: 'Family',
        structure: { sections: [{ title: 'The Tradition', prompts: ['What is the tradition?', 'How did it start?', 'How long has it been going?'] }, { title: 'The People', prompts: ['Who participates?', 'Who started it?'] }, { title: 'The Details', prompts: ['Describe what happens.', 'What makes it special?'] }, { title: 'Legacy', prompts: ['Will you pass it on?', 'How has it evolved over time?'] }] }
      },
      {
        name: 'Life Lesson',
        description: 'Reflect on important lessons learned through life experiences.',
        category: 'Reflections',
        structure: { sections: [{ title: 'The Experience', prompts: ['What happened?', 'When and where?'] }, { title: 'The Challenge', prompts: ['What was difficult about it?', 'How did you feel at the time?'] }, { title: 'The Lesson', prompts: ['What did you learn?', 'How has it shaped you?'] }, { title: 'Advice', prompts: ['What would you tell others?', 'What would you do differently?'] }] }
      },
    ];

    for (const tmpl of templatesData) {
      await client.query(
        'INSERT INTO templates (name, description, structure, category, is_default) VALUES ($1, $2, $3, $4, $5)',
        [tmpl.name, tmpl.description, JSON.stringify(tmpl.structure), tmpl.category, true]
      );
    }
    log.success('15 templates created.');

    // ── Done ─────────────────────────────────────────────────────────
    console.log('');
    log.done('====================================');
    log.done('  Database seeded successfully!');
    log.done('====================================');
    console.log('');
    log.info('Summary:');
    log.info(`  - 1 demo user (${demoEmail})`);
    log.info('  - 15 memory books');
    log.info('  - 15 categories');
    log.info(`  - ${memoriesData.length} memories`);
    log.info('  - 15 tags');
    log.info(`  - ${memoryTagAssociations.length} memory-tag associations`);
    log.info('  - 15 milestones');
    log.info('  - 15 templates');
    console.log('');

  } catch (error) {
    log.error(`Seed failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
