import type { ClassFeedback } from '../FeedbackView';
import type { ClassDataItem } from './feedback-types';

export function mergeClassesWithRatings(
  classesData: { success?: boolean; data?: ClassDataItem[] },
  ratingsData: { success?: boolean; data?: ClassFeedback[] },
): ClassFeedback[] {
  const allFeedback: ClassFeedback[] = [];

  if (classesData.success && Array.isArray(classesData.data)) {
    for (const cls of classesData.data) {
      const ratingClass =
        ratingsData.success && Array.isArray(ratingsData.data)
          ? ratingsData.data.find((rc: ClassFeedback) => rc.id === cls.id)
          : null;

      if (ratingClass) {
        allFeedback.push({
          ...ratingClass,
          university: cls.university,
          carrera: cls.carrera,
          startDate: cls.startDate,
        });
      } else {
        allFeedback.push({
          id: cls.id,
          name: cls.name,
          teacherName:
            cls.teacherName ||
            `${cls.teacherFirstName || ''} ${cls.teacherLastName || ''}`.trim(),
          university: cls.university,
          carrera: cls.carrera,
          startDate: cls.startDate,
          totalRatings: 0,
          averageRating: 0,
          topics: [],
        });
      }
    }
  }

  allFeedback.sort((a, b) => b.averageRating - a.averageRating);
  return allFeedback;
}
