type SectionType = {
	title: string
	text: string
	image: string
}

export interface TranslationData {
	title: string
	description?: string
	full_description?: string
	type: string
	product_variants: string[]
	section_type: SectionType[]
	description_section: any
	configuration: any
	characteristics: any
}

export interface ProfileTranslation {
	title?: string
	description?: string
	full_description?: string
	type?: string
	product_variants?: any
	section_type: SectionType[]
	description_section: any
	configuration: any
	characteristics: any
}

export type TranslationsMap = {
	[locale: string]: TranslationData
}
