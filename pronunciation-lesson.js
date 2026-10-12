/* Orr French curriculum extension: dedicated pronunciation lesson in Unit 2. */
(function(){
'use strict';
function addPronunciationLesson(){
 var curriculum=window.FRENCH_CURRICULUM;
 if(!curriculum||!Array.isArray(curriculum.bookUnits))return;
 var unit=curriculum.bookUnits.find(function(u){return Number(u.u)===2;});
 if(!unit||!Array.isArray(unit.days)||unit.days.some(function(d){return d.id==='pronunciation-sounds-u2';}))return;
 var lesson={
  id:'pronunciation-sounds-u2',
  title:'أصوات اللغة الفرنسية وكيفية لفظها',
  task:'استمع إلى كل صوت، لاحظ حركة الفم والفرق بين الأصوات المتشابهة، ثم كرر الأمثلة وسجّل صوتك إن أمكن.',
  explanation:'لا تمثّل الكتابة العربية النطق الفرنسي بدقة كاملة؛ استخدمها كتقريب أولي فقط، واستمع إلى الصوت الفرنسي وقلّده. ابدأ ببطء ثم زد السرعة تدريجياً. ركّز على الفرق بين الحروف المكتوبة والصوت الذي يُنطق فعلاً.',
  examples:[
   {fr:'é — été — café',ar:'صوت é قريب من «إيه» مغلقة: été (الصيف)، café (قهوة). لا تحوّله إلى صوت «ي» طويل.'},
   {fr:'è / ê — mère — fête',ar:'صوت è وê أفتح من é، قريب من «إِه» مفتوحة: mère (أم)، fête (عيد/احتفال). قارن بين été وmère.'},
   {fr:'u — tu — lune',ar:'صوت u الفرنسي غير موجود تماماً في العربية: قرّب الشفتين كما في «و»، وحاول نطق «إي» مع إبقاء الشفتين مدورتين. أمثلة: tu (أنت)، lune (قمر).'},
   {fr:'ou — vous — rouge',ar:'ou يُنطق قريباً من «و» العربية: vous (أنتم/حضرتك)، rouge (أحمر). لا تخلط بين tu وtout.'},
   {fr:'eu / œu — deux — sœur',ar:'صوت eu في deux وœu في sœur يحتاج إلى تدوير الشفتين؛ لا يوجد مقابل عربي مطابق. استمع إلى الصوت وحاول تقليده دون إضافة واو واضحة.'},
   {fr:'an / en — enfant — vendredi',ar:'صوت أنفي: يخرج الهواء من الأنف مع عدم نطق نون واضحة في نهاية المقطع. أمثلة: enfant (طفل)، vendredi (الجمعة).'},
   {fr:'on — bonjour — maison',ar:'صوت أنفي يشبه «أو» أنفية؛ لا تنطق نوناً منفصلة. أمثلة: bonjour (مرحباً)، maison (منزل).'},
   {fr:'in / ain / ein — matin — pain — plein',ar:'هذه التراكيب غالباً تعطي صوتاً أنفياً قريباً من «إَ» أنفية. أمثلة: matin (صباح)، pain (خبز)، plein (ممتلئ). يختلف الصوت قليلاً بحسب الكلمة واللهجة.'},
   {fr:'un — lundi — parfum',ar:'الصوت الأنفي في un قد يختلف عن in، وقد يقترب منه في نطق بعض المتحدثين. استمع إلى lundi وparfum ولا تضف نوناً كاملة في النهاية.'},
   {fr:'r — rue — Paris',ar:'حرف r الفرنسي يُنطق غالباً من مؤخرة الفم قرب الحلق، وليس مثل الراء العربية الملفوظة بطرف اللسان. لا تبالغ في الخشونة؛ ابدأ بصوت خفيف.'},
   {fr:'j / g — jour — girafe',ar:'j وكذلك g قبل e أو i غالباً صوت قريب من «ژ» كما في كلمة «ژورنال» المتداولة: jour (يوم)، girafe (زرافة). أما g قبل a أو o أو u فعادةً صوت «گ»: gare, gomme.'},
   {fr:'ch — chat — chercher',ar:'ch يُنطق «ش»: chat (قط)، chercher (يبحث). لا تنطقه «تش».'},
   {fr:'gn — montagne — ligne',ar:'gn صوت قريب من «ني» ملتحمة، مثل ñ الإسبانية تقريباً: montagne (جبل)، ligne (خط). لا تنطق g ثم n منفصلتين.'},
   {fr:'ill — famille — travailler',ar:'في كثير من الكلمات يعطي ill صوتاً قريباً من «ي» أو «يي»، كما في famille وtravailler، لكن توجد استثناءات؛ تعلّم الصوت ضمن الكلمة.'},
   {fr:'Les consonnes finales — petit — grand — vous',ar:'كثير من الحروف الساكنة الأخيرة لا تُنطق، مثل t في petit وd في grand وs في vous عند الوقف. توجد استثناءات كثيرة، لذلك احفظ نطق الكلمة مع الاستماع.'},
   {fr:'La liaison — les amis — vous avez',ar:'أحياناً يُنطق الحرف الأخير الصامت عندما تأتي بعده كلمة تبدأ بحركة: les amis تُسمع تقريباً «لي زامي»، وvous avez «ڤو زاڤيه». ليست كل الحالات إلزامية؛ تعلّم الروابط الشائعة أولاً.'},
   {fr:'Bonjour, je m’appelle Hussein.',ar:'مرحباً، اسمي حسين. تدرب على إيقاع الجملة، واربط je m’appelle بسلاسة من دون توقف طويل بين الكلمات.'},
   {fr:'Je voudrais un café, s’il vous plaît.',ar:'أودّ قهوة من فضلك. انتبه إلى u في voudrais وun، وإلى الإيقاع الهادئ في عبارة الطلب.'}
  ],
  exercise:{prompt:'Quel mot contient le son « ou » comme dans vous ?',answer:'rouge',accepted:['rouge'],why:'في rouge يظهر الصوت ou القريب من «و» العربية.'},
  practice:{
   intro:'استمع إلى المثال الفرنسي أولاً، ثم كرره مرتين: مرة ببطء ومرة بالسرعة الطبيعية. اختر الصوت الذي تسمعه، ولا تعتمد على الكتابة العربية وحدها.',
   quiz:[
    {q:'Quel mot contient le son « ou » ?',options:['tu','vous','deux'],answer:1,why:'vous contient «ou», proche du «و» arabe.'},
    {q:'Quelle lettre se prononce souvent comme «ش» dans chat ?',options:['ch','j','gn'],answer:0,why:'ch se prononce comme le son «ش».'},
    {q:'Dans bonjour, le son «on» est généralement…',options:['nasal','un n séparé très net','toujours muet'],answer:0,why:'on forme généralement une voyelle nasale; on ne prononce pas un n séparé.'},
    {q:'Quel mot commence par le son français «ژ» ?',options:['jour','chat','vous'],answer:0,why:'Le j de jour se prononce comme «ژ».'},
    {q:'Quel est le meilleur conseil pour prononcer le «u» français ?',options:['Le remplacer toujours par ou','Arrondir les lèvres et écouter la différence','Ajouter une consonne finale'],answer:1,why:'Le son u demande des lèvres arrondies; il faut le distinguer de ou.'},
    {q:'Dans beaucoup de mots, que devient la consonne finale ?',options:['Elle est toujours prononcée','Elle est souvent muette, avec des exceptions','Elle devient toujours une voyelle'],answer:1,why:'De nombreuses consonnes finales sont muettes, mais il existe des exceptions.'},
    {q:'Dans les amis, la liaison fait entendre…',options:['un son z entre les mots','un son ch','aucun changement possible'],answer:0,why:'On entend généralement «lez amis» grâce à la liaison.'},
    {q:'Quel groupe peut produire une voyelle nasale ?',options:['an / en','ch','j'],answer:0,why:'an et en produisent généralement une voyelle nasale.'}
   ],
   fill:[
    {prompt:'اكتب كلمة فرنسية فيها الصوت ou.',answer:'vous',accepted:['vous','rouge','bonjour','tout'],why:'من الأمثلة: vous، rouge، bonjour، tout.'},
    {prompt:'ما الكلمة الفرنسية التي تعني «قهوة» وتحتوي على é؟',answer:'café',accepted:['café','cafe'],why:'café تحتوي على é مغلقة.'},
    {prompt:'أكمل: les amis. ما صوت الربط الذي نسمعه بين الكلمتين؟',answer:'z',accepted:['z','ز','زاي'],why:'تُسمع liaison بصوت z: «lez amis».'}
   ]
  }
 };
 unit.days.splice(Math.min(1,unit.days.length),0,lesson);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addPronunciationLesson,{once:true});
else addPronunciationLesson();
})();