const TelegramApi = require("node-telegram-bot-api");
const startServer = require("./src/db");
const User = require('./src/model');
require("dotenv").config();

const token = process.env.TELEGRAM_API;
const bot = new TelegramApi(token, { polling: true });

const languages = {
    UZB: {
        start: "Botni ishga tushirish",
        help: "Yordam",
        menuOpened: "Menu ochildi",
        menuClosed: "Menu yopildi",
        contactPrompt: "Kontakt jo'natish",
        locationPrompt: "Manzilni jo'natish",
        moreInfo: "Ko'proq malumot olish uchun Link ustiga bosing 👉 https://uzsuv.uz/uz/",
        complaintPrompt: "Ariza yoki shikoyatingiz bo'lsa yozing",
        complaintAccepted: "Sizning arizangiz qabul qilindi✅",
        notRegistered: "Iltimos, avval ro'yxatdan o'ting.",
        incorrectName: "Ism va Familiya noto'g'ri kiritildi, iltimos tekshirib kiriting \nMisol: Abdullox Hoshimov",
        nameSaved: "1-chi ma'lumot saqlandi \nIltimos, endi pastdagi havolani bosing!",
        dataSaved: "Ma'lumotlaringiz saqlandi! \nBizning xizmatdan foydalanganingiz uchun rahmat ☺️ \nAgar taklif va shikoyatlaringiz bo'lsa, \n/menu orqali murojaat qiling!",
        sendLocation: "Endi manzilingizni jo'nating!",
        adminAccess: "Siz admin huquqlariga egasiz!",
        languageChanged: "Til muafaqiyatli o'zgardi!"
    },
    ENG: {
        start: "Start the bot",
        help: "Help",
        menuOpened: "Menu opened",
        menuClosed: "Menu closed",
        contactPrompt: "Send contact",
        locationPrompt: "Send location",
        moreInfo: "For more information click on the link 👉 https://uzsuv.uz/uz/",
        complaintPrompt: "Please write your complaint or application",
        complaintAccepted: "Your complaint has been accepted✅",
        notRegistered: "Please register first.",
        incorrectName: "Name and surname entered incorrectly, please check and enter again \nExample: John Doe",
        nameSaved: "First information saved \nPlease click the link below!",
        dataSaved: "Your information has been saved! \nThank you for using our service ☺️ \nIf you have suggestions or complaints, \nplease use /menu!",
        sendLocation: "Now send your location!",
        adminAccess: "You have admin access!",
        languageChanged: "Language successfully changed!"
    },
    RU: {
        start: "Запустить бота",
        help: "Помощь",
        menuOpened: "Меню открыто",
        menuClosed: "Меню закрыто",
        contactPrompt: "Отправить контакт",
        locationPrompt: "Отправить местоположение",
        moreInfo: "Для получения дополнительной информации нажмите на ссылку 👉 https://uzsuv.uz/uz/",
        complaintPrompt: "Пожалуйста, напишите вашу жалобу или заявление",
        complaintAccepted: "Ваше заявление принято✅",
        notRegistered: "Пожалуйста, сначала зарегистрируйтесь.",
        incorrectName: "Имя и фамилия введены неправильно, пожалуйста, проверьте и введите снова \nПример: Иван Иванов",
        nameSaved: "Первая информация сохранена \nПожалуйста, нажмите на ссылку ниже!",
        dataSaved: "Ваша информация сохранена! \nСпасибо за использование нашего сервиса ☺️ \nЕсли у вас есть предложения или жалобы, \nпожалуйста, используйте /menu!",
        sendLocation: "Теперь отправьте ваше местоположение!",
        adminAccess: "У вас есть доступ администратора!",
        languageChanged: "Язык успешно изменен!"
    }
};

const createAdminUser = async () => {
    const chatId = '1369846504';
    let adminUser = await User.findOne({ chatId });

    if (!adminUser) {
        adminUser = new User({
            chatId,
            name: 'Admin',
            isAdmin: true
        });
        await adminUser.save();
        console.log('Admin user created');
    } else if (!adminUser.isAdmin) {
        adminUser.isAdmin = true;
        await adminUser.save();
        console.log('Admin user updated');
    }
};

const start = async () => {
    await startServer();
    await createAdminUser();

    bot.setMyCommands([
        { command: '/start', description: languages.UZB.start },
        { command: '/help', description: languages.UZB.help },
    ]);
    
    let setName = false;
    let awaitingComplaint = false; // Shikoyatni kutayotgan holat
    let userLanguage = languages.UZB; // Default language

    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;
        let user = await User.findOne({ chatId });

        bot.setMyCommands([
            { command: '/start', description: userLanguage.start },
            { command: '/menu', description: 'Menuni ochish' },
            { command: '/help', description: userLanguage.help },
        ]);

        try {
            if (text === '/start' || !user) {
                if (!user || !user?.name) {
                    setName = true;
                    await bot.sendMessage(chatId, `Salom ${msg.from.first_name} \nAriza topshirish uchun birinchi Familiya Ismingizni kiriting`);
                    await User.create({ chatId, user: msg.chat });
                    return;
                }

                await bot.sendMessage(chatId, `Salom ${msg.from.first_name} \nSiz oldin ham ro'yxatdan o'tgansiz! \nRo'yxatdan o'tgan sana: ${new Date(user.createdAt).toLocaleDateString()}`, {
                    reply_markup: {
                        keyboard: [
                            [{ text: `🔗 Menu`, callback_data: '/menu' }]
                        ],
                        resize_keyboard: true
                    }
                });
                return;
            }

            if (text === '/help') {
                return await bot.sendMessage(chatId,
                    `1. Botni ishga tushirish uchun /start ni bosing.\n
Familiya va Ismingizni kiriting.\n

Telefon raqamingizni jo'nating.\n

Muammo bor joyni manzilini jo'nating.\n

Taklifingiz bo'lsa /menu ni bosing.`);
            }
            if (text === '/menu' || text === `🔗 Menu`) {
                return await bot.sendMessage(chatId, userLanguage.menuOpened, {
                    reply_markup: {
                        keyboard: [
                            [{ text: `📄 Ariza va shikoyatlar`, callback_data: '/voice' }, { text: `🔎 Ma'lumot olish`, callback_data: '/info' }],
                            [{ text: `🌐 Tilni o'zgartirish`, callback_data: '/change_language' }],
                            [`❌ Menu ni yopish`]
                        ],
                        resize_keyboard: true
                    }
                });
            }

            if (text === `🔎 Ma'lumot olish` || text === '/info' ) {
                return await bot.sendMessage(chatId, userLanguage.moreInfo);
            }

            if (text === `📄 Ariza va shikoyatlar` || text === '/voice') {
                awaitingComplaint = true;
                return await bot.sendMessage(chatId, userLanguage.complaintPrompt);
            }

            if (awaitingComplaint) {
                awaitingComplaint = false;
                if (user) {
                    user.problems.push(text);
                    await User.findByIdAndUpdate(user._id, user, { new: true });
                    return await bot.sendMessage(chatId, userLanguage.complaintAccepted);
                } else {
                    return await bot.sendMessage(chatId, userLanguage.notRegistered);
                }
            }

            if (setName) {
                if (text.split(' ').length <= 1) {
                    return await bot.sendMessage(chatId, userLanguage.incorrectName);
                } else {
                    setName = false;
                    user.name = text;
                    await User.findByIdAndUpdate(user._id, user, { new: true });
                    return await bot.sendMessage(chatId, userLanguage.nameSaved, {
                        reply_markup: {
                            keyboard: [
                                [{ text: userLanguage.contactPrompt, request_contact: true }]
                            ],
                            resize_keyboard: true
                        }
                    });
                }
            }

            if (msg.location) {
                user.location = msg.location;
                await bot.sendMessage(chatId, userLanguage.dataSaved, {
                    reply_markup: {
                        remove_keyboard: true
                    }
                });

                await User.findByIdAndUpdate(user._id, user, { new: true });
                return;
            }

            if (msg.contact) {
                user.contact = msg.contact;
                await bot.sendMessage(chatId, userLanguage.sendLocation, {
                    reply_markup: {
                        keyboard: [
                            [{ text: userLanguage.locationPrompt, request_location: true }]
                        ],
                        resize_keyboard: true
                    }
                });

                await User.findByIdAndUpdate(user._id, user, { new: true });
                return;
            }

            if (text == `❌ Menu ni yopish`) {
                return await bot.sendMessage(chatId, userLanguage.menuClosed, {
                    reply_markup: {
                        remove_keyboard: true
                    }
                });
            }

            if (text == `🌐 Tilni o'zgartirish` || text === '/change_language') {
                return await bot.sendMessage(chatId, "Tilni tanlang:", {
                    reply_markup: {
                        keyboard: [
                            [{ text: '🇺🇸 ENG' }, { text: '🇷🇺 RUS' }, { text: '🇺🇿 UZB' }],
                            [`❌ Menu ni yopish`]
                        ],
                        resize_keyboard: true
                    }
                });
            }

            if (text === '🇺🇸 ENG') {
                userLanguage = languages.ENG;
                return await bot.sendMessage(chatId, userLanguage.languageChanged);
            } else if (text === '🇷🇺 RUS') {
                userLanguage = languages.RU;
                return await bot.sendMessage(chatId, userLanguage.languageChanged);
            } else if (text === '🇺🇿 UZB') {
                userLanguage = languages.UZB;
                return await bot.sendMessage(chatId, userLanguage.languageChanged);
            }

            // Admin buyruqlarini tekshirish
            if (user && user.isAdmin) {
                if (text === '/admin' || text === 'Admin') {
                    return await bot.sendMessage(chatId, userLanguage.adminAccess);
                }
                // Qo'shimcha admin buyruqlari
            }

        } catch (error) {
            console.log(error.message);
        }
    });
}

start();
