import type {WeddingMessageKey} from './es'
import {enMessages} from './en'

export const bgMessages = {
    ...enMessages,
    'video.label': 'Видео на двойката',
    'video.play': 'Пуснете видеото',
    'event.title': 'Ще се женим',
    'event.seoTitle': 'Сватбена покана на Гала и Валентин',
    'event.seoDescription': 'Присъединете се към нас, за да отпразнуваме специалния ни ден.',
    'hero.partnerOne': 'Гала', 'hero.partnerTwo': 'Валентин', 'hero.subtitle': 'Ще се радваме да споделим този ден с вас',
    'countdown.label': 'До големия ден остават', 'countdown.days': 'дни', 'countdown.hours': 'часа', 'countdown.minutes': 'минути', 'countdown.seconds': 'секунди',
    'venue.label': 'Празненството', 'venue.ceremony.type': 'Церемония', 'venue.ceremony.name': 'Църква „Сан Педро“', 'venue.ceremony.address': 'Кале Майор 1, Мадрид', 'venue.reception.type': 'Прием', 'venue.reception.name': 'Имение „Ла Росаледа“', 'venue.reception.address': 'Имение „Ла Росаледа“, Мадрид', 'venue.map': 'Вижте на картата',
    'rsvp.cta': 'Потвърдете присъствие', 'rsvp.success.title': 'Благодарим ви!', 'rsvp.success.attending': 'Вашето присъствие е потвърдено. До скоро!', 'rsvp.success.declined': 'Съжаляваме, че няма да можете да присъствате. Ще ни липсвате.', 'rsvp.success.home': 'Обратно към поканата',
    'rsvp.step.attendance.title': 'Присъствие', 'rsvp.step.attendance.subtitle': 'Моля, потвърдете дали ще бъдете с нас', 'rsvp.fullName.label': 'Име и фамилия *', 'rsvp.fullName.placeholder': 'Вашите имена', 'rsvp.required': 'Това поле е задължително', 'rsvp.attending.label': 'Ще можете ли да присъствате? *', 'rsvp.attending.yes': 'Да, ще бъда там!', 'rsvp.attending.no': 'Няма да мога да присъствам', 'rsvp.attending.required': 'Моля, изберете опция',
    'rsvp.send': 'Изпратете отговор', 'rsvp.next': 'Напред', 'rsvp.back': 'Назад', 'rsvp.submit': 'Потвърдете всичко', 'rsvp.submitting': 'Изпращане...',
    'rsvp.step.meal.title': 'Меню и транспорт', 'rsvp.step.meal.subtitle': 'Помогнете ни да организираме всеки детайл', 'rsvp.dietary.label': 'Хранителни изисквания', 'rsvp.dietary.none': 'Нямам, хапвам всичко', 'rsvp.dietary.gluten': 'Цьолиакия / непоносимост към глутен', 'rsvp.dietary.vegetarian': 'Вегетарианец / веган', 'rsvp.dietary.lactose': 'Непоносимост към лактоза', 'rsvp.dietary.nutsSeafood': 'Алергия към ядки или морски дарове', 'rsvp.dietary.other': 'Други подробности...',
    'rsvp.bus.label': 'Място в автобуса', 'rsvp.bus.placeholder': 'Изберете опция...', 'rsvp.bus.roundTrip': 'Да, в двете посоки', 'rsvp.bus.outbound': 'Само на отиване', 'rsvp.bus.return': 'Само на връщане', 'rsvp.bus.no': 'Не, ще организирам собствен транспорт',
    'rsvp.step.music.title': 'Меден месец и музика', 'rsvp.step.music.subtitle': 'Помогнете ни да създадем музикалната програма', 'rsvp.gift.info': 'Вашето присъствие е най-ценният ни подарък. Ако желаете да допринесете за новото ни приключение, ще предоставим подробности. Благодарим ви!', 'rsvp.song.label': 'Песен за дансинга', 'rsvp.song.placeholder': 'Заглавие и изпълнител',
    'rsvp.step.message.title': 'Няколко думи', 'rsvp.step.message.subtitle': 'Оставете ни специално послание', 'rsvp.message.label': 'Вашето послание', 'rsvp.message.placeholder': 'Напишете посланието си тук...', 'rsvp.error.submit': 'Не успяхме да запазим отговора ви. Моля, опитайте отново.',
    'admin.title': 'RSVP отговори', 'admin.password': 'Парола', 'admin.access': 'Вход', 'admin.password.invalid': 'Грешна парола.', 'admin.password.missing': 'Грешка в конфигурацията: липсва ADMIN_PASSWORD.', 'admin.refresh': 'Обновяване', 'admin.logout': 'Изход',
    'admin.stats.responses': 'Отговори', 'admin.stats.attending': 'Ще присъстват', 'admin.stats.declined': 'Няма да присъстват', 'admin.stats.bus': 'Автобус', 'admin.filter.label': 'Филтър:', 'admin.filter.all': 'Всички', 'admin.filter.confirmed': 'Потвърдени', 'admin.filter.declined': 'Отказали', 'admin.filter.bus': 'Нуждаят се от автобус',
    'admin.loading': 'Зареждане...', 'admin.empty': 'Няма отговори за показване.', 'admin.loadError': 'Отговорите не можаха да бъдат заредени:', 'admin.guest': 'Гост', 'admin.attends': 'Присъства', 'admin.dietary': 'Хранителни изисквания', 'admin.bus': 'Автобус', 'admin.song': 'Песен', 'admin.message': 'Послание', 'common.yes': 'Да', 'common.no': 'Не',
    'route.notFound': 'Страницата не е намерена', 'language.label': 'Език', 'language.es': 'Español', 'language.en': 'English', 'language.bg': 'Български', 'language.loading': 'Смяна на езика…', 'language.error': 'Езикът не можа да бъде зареден.',
} as const satisfies Record<WeddingMessageKey, string>
