import fs from 'fs'
import formidable, { File } from 'formidable'
import { Request, Response } from 'express'
import { transporter } from '../utils/mailer'
import { Attachment } from 'nodemailer/lib/mailer'
import { escape } from '../utils/functions'

export const sendEmail = async (req: Request, res: Response) => {
	const form = formidable({ multiples: true })

	form.parse(req, async (err, fields, files) => {
		if (err) {
			console.error('Ошибка при разборе формы:', err)
			return res.status(400).json({ message: 'Ошибка при разборе формы' })
		}

		try {
			const uploadedFiles = files.files
				? Array.isArray(files.files)
					? files.files
					: [files.files]
				: []

			const attachments: Attachment[] = uploadedFiles.map(
				(file: File) => ({
					filename: file.originalFilename ?? 'file',
					content: fs.readFileSync(file.filepath),
					contentType: file.mimetype ?? undefined,
				})
			)

			const mailOptions = {
				from: 'info@kraabmod.fi',
				to: 'info@kraabmod.fi',
				subject: 'New Client Request!',
				html: `
          <html lang="fi">
          <head>
              <meta charset="UTF-8">
              <title>New Client Request</title>
          </head>
          <body>
            <h2>New Client Request</h2>
            <p><strong>Name:</strong> ${fields.name}</p>
            <p><strong>Last Name:</strong> ${fields.last_name}</p>
            <p><strong>City:</strong> ${fields.city}</p>
            <p><strong>Postal Code:</strong> ${fields.postal_code}</p>
            <p><strong>Street:</strong> ${fields.street}</p>
            <p><strong>Phone:</strong> ${fields.telephone}</p>
            <p><strong>Message:</strong> ${fields.message}</p>
          </body>
          </html>`,
				attachments,
			}

			await transporter.sendMail(mailOptions)

			res.status(200).json({ success: true })
		} catch (error) {
			console.error('Ошибка при отправке email:', error)
			res.status(500).json({ message: 'Ошибка при отправке email' })
		}
	})
}

export const sendOrderEmail = async (
	req: Request,
	res: Response
): Promise<void> => {
	const {
		name,
		email,
		message,
		payment,
		phone,
		orderDataParams = [],
		textureList = [],
		totalOrderSum,
		ceilingTitle,
	} = req.body

	// Минимальная валидация
	if (!name || !email || !orderDataParams.length) {
		res.status(400).json({ message: 'Missing required fields' })
	}

	try {
		const orderDataHtml = orderDataParams
			.map((item: any) => {
				const unit = item.unit ? item.unit : ''
				const price = item.price * item.value
				return `<p>${escape(item.title)} ${
					item.value
				} ${unit} | <strong>${price} €</strong></p>`
			})
			.join('')

		const textureHtml = textureList
			.map((item: string) => `<p>${escape(item)}</p>`)
			.join('')

		const html = `
			<h2>New Client Request From Calculator</h2>
			<p><strong>Name:</strong> ${escape(name)}</p>
			<p><strong>Phone:</strong> ${escape(phone)}</p>
			<p><strong>Email:</strong> ${escape(email)}</p>
			<p><strong>Payment type:</strong> ${escape(payment)}</p>
			<p><strong>Message:</strong> ${escape(message)}</p>
			<p><strong>Ceiling type:</strong> ${escape(ceilingTitle)}</p>
			<h3>Textures:</h3>
			${textureHtml}
			<h3>Order Details:</h3>
			${orderDataHtml}
			<br /><br />
			<h2><strong>Total Order Sum:</strong> ${totalOrderSum} €</h2>
		`

		const mailOptions = {
			from: 'info@kraabmod.fi',
			to: 'info@kraabmod.fi',
			subject: 'New Client Request From Calculator!',
			html,
		}

		await transporter.sendMail(mailOptions)

		res
			.status(200)
			.json({ message: 'Email sent successfully', success: true })
	} catch (error) {
		console.error('Email sending error:', error)
		res.status(500).json({ message: 'Error sending email', error })
	}
}
