export interface Award {
  id: string
  title: string
  description: string
  /** awarding body or category, shown as the small caption on the medallion */
  kind: string
  /** year conferred */
  year: string
  image?: string
}

export interface Certificate {
  id: string
  /** issuing body */
  body: string
  title: string
  year: string
  image?: string
}
