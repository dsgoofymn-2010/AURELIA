export type ProjectCategory = 'residential' | 'commercial' | 'civic'

export interface Project {
  /** also the URL slug: /projects/<id>, and the media file name */
  id: string
  name: string
  kind: string
  category: ProjectCategory
  blurb: string
  /** the three beats of the construction film, in order */
  stages: [string, string, string]
  /**
   * No construction film yet: only the finished-building image exists, and it is
   * revealed rising from the ground instead. Remove once <id>.mp4 is rendered.
   */
  noFilm?: true
}
