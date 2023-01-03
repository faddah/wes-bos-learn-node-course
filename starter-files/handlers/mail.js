const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
	host: process.env.MAIL_HOST,
	port: process.env.MAIL_PORT,
	auth: {
		user: process.env.MAIL_USER,
		pass: process.env.MAIL_PASS,
	}
})

const generateHTML = (filename, options = {}) => {
	const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
	const inlined = juice(html);
	// console.log(inlined);
	return inlined;
}

exports.send = async (options) => {
	const html = generateHTML(options.filename, options);
	const text = htmlToText.convert(html, {wordwrap: 130});
	const mailOptions = {
		from: `Dang That's Delicious! <info@dangthatsdelicious.net>`,
		to: options.user.email,
		subject: options.subject,
		html,
		text,
	};
	const sendMail = promisify(transport.sendMail, transport);
	return sendMail(mailOptions);
}

/* 
transport.sendMail({
	from: 'faddah <my_biz@me.com>',
	to: 'schlemmy@schlemmy.net',
	subject: 'a love that dare not speak it\'s name.',
	html: `<h2 style="color: dodgerblue">Hey! Yr a Schmoe! 😜 ❤️</h2>`,
	text: `Hey! Yr a Schmoe! 😜 ❤️`
})
 */

