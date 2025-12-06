import React, { useState } from 'react';
import { physicsChapters, Chapter } from '../data/physicsTopics';

interface TopicSelectionScreenProps {
  onTopicSelected: (chapter: Chapter, topicName: string) => void;
  initialYear: '1st Year PUC' | '2nd Year PUC' | null;
}

export const TopicSelectionScreen: React.FC<TopicSelectionScreenProps> = ({
  onTopicSelected,
  initialYear,
}) => {
  const [selectedYear, setSelectedYear] = useState<'1st Year PUC' | '2nd Year PUC'>(
    initialYear || '1st Year PUC'
  );
  const [openChapter, setOpenChapter] = useState<string | null>(null);

  const filteredChapters = physicsChapters.filter((c) => c.year === selectedYear);
  const years: ('1st Year PUC' | '2nd Year PUC')[] = ['1st Year PUC', '2nd Year PUC'];

  return (
    <div className="container mx-auto p-4 md:p-8 animate-fadeIn">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[color:var(--text-heading)]">
          Select a Topic
        </h1>
        <p className="text-lg text-[color:var(--text-subheading)] mt-2">
          Choose a chapter and topic to begin.
        </p>
      </div>

      {/* Year Selection Tabs */}
      <div className="flex justify-center mb-6 gap-3">
        {years.map((year) => {
          const isActive = selectedYear === year;
          return (
            <button
              key={year}
              onClick={() => {
                setSelectedYear(year);
                setOpenChapter(null); // Close accordion on year change
              }}
              className={`px-6 py-2 text-sm font-semibold year-pill ${
                isActive ? 'year-pill-active' : ''
              }`}
            >
              {year}
            </button>
          );
        })}
      </div>

      {/* Chapters & Topics */}
      <div className="max-w-3xl mx-auto space-y-4">
        {filteredChapters.map((chapter, index) => (
          <div
            key={chapter.name}
            className="glassmorphism rounded-2xl overflow-hidden animate-card-enter cursor-pointer"
            style={{ animationDelay: `${index * 70}ms` }}
            onClick={() => setOpenChapter(openChapter === chapter.name ? null : chapter.name)}
          >
            {/* Chapter header */}
            <div
              className="w-full flex justify-between items-center p-4 text-left"
            >
              <span className="font-semibold text-lg text-[color:var(--text-primary)]">
                {chapter.name}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform duration-300 text-[color:var(--text-secondary)] ${
                  openChapter === chapter.name ? 'rotate-180' : ''
                }`}
              >
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </div>

            {/* Topic buttons */}
            {openChapter === chapter.name && (
              <div className="px-4 pb-4 space-y-2">
                {chapter.topics.map((topic) => (
                  <button
                    key={topic.name}
                    onClick={(e) => {
                       e.stopPropagation(); // Prevent closing accordion when clicking a topic
                       onTopicSelected(chapter, topic.name)
                    }}
                    className="topic-button"
                  >
                    {topic.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};