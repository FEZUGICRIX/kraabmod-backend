export interface TranslationData {
	title: string
	description?: string
	full_description?: string
	type: string
}

export type TranslationsMap = {
	[locale: string]: TranslationData
}
