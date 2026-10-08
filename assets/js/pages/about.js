// Our story — static, crawlable content; Bangla comes from extend() + data-i18n.
import { boot, CONTACT } from '/assets/js/core/layout.js';
import { extend } from '/assets/js/core/i18n.js';

extend({
  en: {
    abEyebrow: 'Est. in Sylhet', abTitle1: 'Stitched with', abTitle2: 'tradition',
    abLede: 'Mohor Clothings is a small Sylhet house making three-piece sets, kurtis and khadi for the modern Bangladeshi woman.',
    abStoryEyebrow: 'Our story', abStoryTitle: 'From Sylhet, for every day and every celebration',
    abStory1: 'Welcome to Mohor Clothings, your destination for handcrafted luxury fashion in Bangladesh. From breathable, premium soft-cotton three-piece ensembles to elegantly tailored kurtis and authentic khadi wear, every piece is designed with the modern woman in mind.',
    abStory2: 'Whether you are stepping into a university classroom, leading a corporate meeting or celebrating a festive occasion, our collections offer the perfect fit. Proudly serving Sylhet and customers nationwide, we bring you high-quality embroidery and timeless designs that empower your everyday wardrobe.',
    abStory3: 'Sylhet has long been known for its weavers, tailors and its love of fine cloth. Mohor — the old gold coin — is our promise that each piece carries that same quiet worth.',
    abValuesTitle: 'What we stand for',
    abV1T: 'Handcrafted detail', abV1: 'High-quality embroidery and finishing worked by hand into every piece.',
    abV2T: 'Premium fabric', abV2: 'Breathable, premium soft cotton and authentic khadi, chosen for comfort in our climate.',
    abV3T: 'Nationwide delivery', abV3: 'Proudly serving Sylhet and shipping to customers all across Bangladesh, cash on delivery.',
    abV4T: 'Honest care', abV4: 'We call to confirm every order, and help with sizes and exchanges personally.',
    abCraftEyebrow: 'The craft', abCraftTitle: 'Cut, stitched and finished by hand',
    abC1T: 'Choosing the cloth', abC1: 'Soft cotton, lawn and khadi are picked for how they breathe and how they drape.',
    abC2T: 'Embroidery', abC2: 'Necklines and borders are embroidered with care, thread by thread.',
    abC3T: 'Finishing', abC3: 'Every seam is checked and pressed before a piece is folded for you.',
    abContactEyebrow: 'Say hello', abContactTitle: 'We would love to hear from you',
    abLocation: 'Based in Sylhet, Bangladesh — delivering nationwide. Every day, 10am – 10pm.',
    abShop: 'Explore the collection',
  },
  bn: {
    abEyebrow: 'সিলেটে প্রতিষ্ঠিত', abTitle1: 'ঐতিহ্যের', abTitle2: 'সুতোয় বোনা',
    abLede: 'মোহর ক্লোদিংস সিলেটের একটি ছোট প্রতিষ্ঠান — আধুনিক বাংলাদেশি নারীর জন্য থ্রি-পিস, কুর্তি ও খাদি তৈরি করি।',
    abStoryEyebrow: 'আমাদের গল্প', abStoryTitle: 'সিলেট থেকে — প্রতিদিনের জন্য, প্রতিটি উৎসবের জন্য',
    abStory1: 'মোহর ক্লোদিংসে স্বাগতম — বাংলাদেশে হাতে তৈরি বিলাসী পোশাকের ঠিকানা। আরামদায়ক প্রিমিয়াম সফট কটনের থ্রি-পিস থেকে শুরু করে সুন্দর কাটিংয়ের কুর্তি ও খাঁটি খাদি — প্রতিটি পোশাক আধুনিক নারীর কথা ভেবে তৈরি।',
    abStory2: 'বিশ্ববিদ্যালয়ের ক্লাস, অফিসের মিটিং কিংবা উৎসবের দিন — আমাদের কালেকশন সব জায়গায় মানানসই। সিলেটসহ সারা দেশের ক্রেতাদের কাছে আমরা পৌঁছে দিই উন্নত মানের এমব্রয়ডারি আর চিরন্তন ডিজাইন।',
    abStory3: 'সিলেট বহুদিন ধরে তাঁতি, দর্জি আর সূক্ষ্ম কাপড়ের প্রতি ভালোবাসার জন্য পরিচিত। "মোহর" — পুরোনো দিনের সোনার মুদ্রা — আমাদের প্রতিশ্রুতি যে প্রতিটি পোশাকে সেই নীরব মূল্য থাকবে।',
    abValuesTitle: 'আমরা যা বিশ্বাস করি',
    abV1T: 'হাতের কাজের সূক্ষ্মতা', abV1: 'প্রতিটি পোশাকে হাতে করা উন্নত মানের এমব্রয়ডারি ও ফিনিশিং।',
    abV2T: 'প্রিমিয়াম কাপড়', abV2: 'আমাদের আবহাওয়ায় আরামের জন্য বাছাই করা নরম কটন ও খাঁটি খাদি।',
    abV3T: 'সারা দেশে ডেলিভারি', abV3: 'সিলেটসহ বাংলাদেশের সব জায়গায় ডেলিভারি, ক্যাশ অন ডেলিভারি।',
    abV4T: 'আন্তরিক যত্ন', abV4: 'প্রতিটি অর্ডার আমরা কল করে কনফার্ম করি, সাইজ ও এক্সচেঞ্জে নিজেরাই সাহায্য করি।',
    abCraftEyebrow: 'কারুকাজ', abCraftTitle: 'হাতে কাটা, হাতে সেলাই, হাতে ফিনিশ',
    abC1T: 'কাপড় বাছাই', abC1: 'নরম কটন, লন ও খাদি বাছাই করা হয় আরাম আর ড্রেপের কথা ভেবে।',
    abC2T: 'এমব্রয়ডারি', abC2: 'গলা ও পাড়ের কাজ যত্ন নিয়ে, সুতোয় সুতোয় করা হয়।',
    abC3T: 'ফিনিশিং', abC3: 'ভাঁজ করে আপনার কাছে পাঠানোর আগে প্রতিটি সেলাই যাচাই ও আয়রন করা হয়।',
    abContactEyebrow: 'যোগাযোগ', abContactTitle: 'আপনার কথা শুনতে চাই',
    abLocation: 'সিলেট, বাংলাদেশ — সারা দেশে ডেলিভারি। প্রতিদিন, সকাল ১০টা – রাত ১০টা।',
    abShop: 'কালেকশন দেখুন',
  },
});

await boot({ page: 'about' });

// Keep contact links in sync with the single source of truth.
const wa = document.querySelector('#about-contact .btn-wa');
if (wa) wa.href = `https://wa.me/${CONTACT.whatsapp}`;
const social = document.querySelectorAll('#about-social a');
[CONTACT.facebook, CONTACT.instagram, CONTACT.messenger].forEach((href, i) => { if (social[i] && href) social[i].href = href; });
