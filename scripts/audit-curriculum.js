#!/usr/bin/env node
'use strict';

/**
 * Structural and assessment audit for the UR French curriculum.
 * Run from the repository root: node scripts/audit-curriculum.js
 * This does not claim to validate every French sentence semantically.
 */
const fs = require('node:fs');
const path = require('node:path');

const curriculumPath = path.join(__dirname, '..', 'curriculum.js');
const source = fs.readFileSync(curriculumPath, 'utf8');
const match = source.match(/window\.FRENCH_CURRICULUM\s*=\s*([\s\S]*?);?\s*$/);
if (!match) {
  console.error('FAIL: Could not locate window.FRENCH_CURRICULUM assignment.');
  process.exit(2);
}

let curriculum;
try {
  curriculum = JSON.parse(match[1]);
} catch (error) {
  console.error('FAIL: Curriculum payload is not valid JSON:', error.message);
  process.exit(2);
}

const errors = [];
const warnings = [];
const stats = {};
const addError = (message) => errors.push(message);
const addWarning = (message) => warnings.push(message);
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const normalized = (value) => String(value || '').normalize('NFC').trim().toLocaleLowerCase();

const plan = curriculum.coursePlan || {};
const levels = Array.isArray(plan.levels) ? plan.levels : [];
const expectedWeeks = levels.reduce((sum, level) => sum + (Number(level.weekCount) || 0), 0);
const expectedHours = levels.reduce((sum, level) => sum + (Number(level.hours) || 0), 0);
stats.plan = {
  totalWeeks: plan.totalWeeks,
  hoursPerWeek: plan.hoursPerWeek,
  totalHours: plan.totalHours,
  levelWeeksSum: expectedWeeks,
  levelHoursSum: expectedHours,
  calculatedHours: Number(plan.totalWeeks) * Number(plan.hoursPerWeek)
};
if (expectedWeeks !== Number(plan.totalWeeks)) addError('Course-plan level week counts do not add up to totalWeeks.');
if (expectedHours !== Number(plan.totalHours)) addError('Course-plan level hours do not add up to totalHours.');
if (Number(plan.totalWeeks) * Number(plan.hoursPerWeek) !== Number(plan.totalHours)) {
  addError('totalWeeks × hoursPerWeek does not equal totalHours.');
}

const bookUnits = Array.isArray(curriculum.bookUnits) ? curriculum.bookUnits : [];
const bookExercises = [];
const bookTitles = [];
for (const unit of bookUnits) {
  if (!nonEmpty(unit.name)) addError('Book unit ' + unit.u + ' has no name.');
  if (!Array.isArray(unit.days) || unit.days.length === 0) {
    addError('Book unit ' + unit.u + ' has no lessons.');
    continue;
  }
  for (const day of unit.days) {
    if (!nonEmpty(day.title) || !nonEmpty(day.task) || !nonEmpty(day.explanation)) {
      addError('Book unit ' + unit.u + ' contains a lesson missing title, task, or explanation.');
    }
    bookTitles.push({ unit: unit.u, title: normalized(day.title) });
    if (day.exercise) {
      bookExercises.push(day.exercise);
      if (!nonEmpty(day.exercise.answer) || !Array.isArray(day.exercise.accepted) || day.exercise.accepted.length === 0) {
        addError('Book exercise missing answer/accepted alternatives: unit ' + unit.u + ', ' + day.title);
      }
    }
    for (const example of day.examples || []) {
      if (!nonEmpty(example.fr) || !nonEmpty(example.ar)) {
        addError('Bilingual example incomplete: unit ' + unit.u + ', ' + day.title);
      }
    }
    for (const [index, question] of (day.practice && day.practice.quiz || []).entries()) {
      if (!Array.isArray(question.options) || !Number.isInteger(question.answer) ||
          question.answer < 0 || question.answer >= question.options.length) {
        addError('Invalid book quiz answer index: unit ' + unit.u + ', ' + day.title + ', question ' + (index + 1));
      }
      if (!nonEmpty(question.q) || !nonEmpty(question.why)) {
        addError('Book quiz missing question or explanation: unit ' + unit.u + ', ' + day.title);
      }
    }
  }
}
stats.bookUnits = bookUnits.length;
stats.bookLessons = bookUnits.reduce((sum, unit) => sum + (unit.days || []).length, 0);
stats.bookExercises = bookExercises.length;

const months = Array.isArray(curriculum.roadmapMonths) ? curriculum.roadmapMonths : [];
const weeks = [];
for (const month of months) {
  if (!Array.isArray(month) || month.length < 5) {
    addError('Roadmap month entry has an invalid shape.');
    continue;
  }
  const [monthNumber, monthLevel, monthTitle, monthDescription, monthWeeks] = month;
  if (!nonEmpty(monthTitle) || !nonEmpty(monthDescription)) {
    addError('Roadmap month ' + monthNumber + ' is missing a title or description.');
  }
  if (!Array.isArray(monthWeeks) || monthWeeks.length !== 4) {
    addError('Roadmap month ' + monthNumber + ' should contain exactly four weekly plans.');
  }
  for (const entry of monthWeeks || []) {
    if (!Array.isArray(entry) || entry.length < 4 || !entry[3] || typeof entry[3] !== 'object') {
      addError('Roadmap week entry has an invalid shape in month ' + monthNumber + '.');
      continue;
    }
    const [title, description, task, details] = entry;
    const week = { monthNumber, monthLevel, monthTitle, title, description, task, ...details };
    weeks.push(week);
    if (!nonEmpty(title) || !nonEmpty(description) || !nonEmpty(task)) {
      addError('Roadmap week is missing title, description, or task in month ' + monthNumber + '.');
    }
    if (!Number.isInteger(week.weekNumber)) addError('Missing integer weekNumber for ' + title + '.');
    if (week.weekHours !== 8 || week.trainingHours !== 8) {
      addError('Expected 8 study hours for week ' + week.weekNumber + '.');
    }
    if (!Array.isArray(week.vocab) || week.vocab.length === 0) {
      addError('No vocabulary list for week ' + week.weekNumber + '.');
    } else {
      for (const item of week.vocab) {
        if (!nonEmpty(item.fr) || !nonEmpty(item.ar) || !nonEmpty(item.example)) {
          addError('Incomplete French/Arabic/example vocabulary card in week ' + week.weekNumber + '.');
        }
      }
    }
    if (!Array.isArray(week.quiz) || week.quiz.length !== 4) {
      addError('Expected four quiz questions in week ' + week.weekNumber + '.');
    }
    for (const [index, question] of (week.quiz || []).entries()) {
      if (!nonEmpty(question.q) || !nonEmpty(question.why)) {
        addError('Missing question or rationale in week ' + week.weekNumber + ', question ' + (index + 1) + '.');
      }
      if (!Array.isArray(question.options) || question.options.length < 2 ||
          !Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.options.length) {
        addError('Invalid quiz options/answer index in week ' + week.weekNumber + ', question ' + (index + 1) + '.');
      }
      const optionSet = new Set((question.options || []).map(normalized));
      if (optionSet.size !== (question.options || []).length) {
        addWarning('Repeated options in week ' + week.weekNumber + ', question ' + (index + 1) + '.');
      }
    }
    if (!Array.isArray(week.sessions) || week.sessions.length !== 6) {
      addError('Expected six learning sessions in week ' + week.weekNumber + '.');
    }
    if (!Array.isArray(week.resources) || week.resources.length === 0) {
      addWarning('No external learning resource listed for week ' + week.weekNumber + '.');
    }
    if (!nonEmpty(week.prerequisite) || !nonEmpty(week.nextStep) || !nonEmpty(week.reviewConnection)) {
      addWarning('Missing explicit prerequisite/next-step/review bridge in week ' + week.weekNumber + '.');
    }
  }
}
const sortedWeekNumbers = weeks.map(week => week.weekNumber).filter(Number.isInteger).sort((a, b) => a - b);
const uniqueWeekNumbers = new Set(sortedWeekNumbers);
stats.roadmap = {
  months: months.length,
  weeklyPlans: weeks.length,
  firstWeek: sortedWeekNumbers[0],
  lastWeek: sortedWeekNumbers[sortedWeekNumbers.length - 1],
  weeklyQuizQuestions: weeks.reduce((sum, week) => sum + (week.quiz || []).length, 0),
  uniqueWeekNumbers: uniqueWeekNumbers.size
};
for (let number = 9; number <= 80; number++) {
  if (!uniqueWeekNumbers.has(number)) addError('Missing roadmap week number ' + number + '.');
}
if (sortedWeekNumbers.length !== uniqueWeekNumbers.size) addError('Duplicate roadmap week numbers found.');
for (const week of weeks) {
  const n = week.weekNumber;
  const expectedLevel = n <= 20 ? 'A2' : n <= 40 ? 'B1' : n <= 64 ? 'B2' : 'DELF B2';
  if (week.monthLevel !== expectedLevel) addError('CEFR/exam level does not match week ' + n + ': expected ' + expectedLevel + ', got ' + week.monthLevel + '.');
}

const promptLocations = new Map();
for (const week of weeks) {
  for (const [index, question] of (week.quiz || []).entries()) {
    const key = normalized(question.q);
    if (!key) continue;
    if (!promptLocations.has(key)) promptLocations.set(key, []);
    promptLocations.get(key).push({ week: week.weekNumber, title: week.title, index: index + 1 });
  }
}
const repeatedPrompts = [...promptLocations.entries()].filter(([, locations]) => locations.length > 1);
const exactQuestions = new Map();
for (const week of weeks) {
  for (const [index, question] of (week.quiz || []).entries()) {
    const key = JSON.stringify({
      q: normalized(question.q),
      options: (question.options || []).map(normalized),
      answer: question.answer,
      why: normalized(question.why)
    });
    if (!exactQuestions.has(key)) exactQuestions.set(key, []);
    exactQuestions.get(key).push({ week: week.weekNumber, title: week.title, index: index + 1 });
  }
}
const exactDuplicateGroups = [...exactQuestions.values()].filter(locations => locations.length > 1);
stats.quizReuse = {
  totalQuestions: weeks.reduce((sum, week) => sum + (week.quiz || []).length, 0),
  uniquePrompts: promptLocations.size,
  repeatedPromptGroups: repeatedPrompts.length,
  exactDuplicateGroups: exactDuplicateGroups.length,
  exactDuplicateQuestionOccurrences: exactDuplicateGroups.reduce((sum, locations) => sum + locations.length, 0)
};
if (repeatedPrompts.length) {
  addWarning(stats.quizReuse.repeatedPromptGroups + ' quiz prompt groups recur across weeks; some repetition may be intentional spaced practice, but review the exact duplicates for meaningful progression.');
}

const vocabulary = Array.isArray(curriculum.additionalVocabulary) ? curriculum.additionalVocabulary : [];
const vocabSeen = new Map();
const duplicateVocabulary = [];
for (const item of vocabulary) {
  if (!nonEmpty(item.fr) || !nonEmpty(item.ar) || !nonEmpty(item.en)) {
    addError('Additional vocabulary entry missing French, Arabic, or English text: ' + item.id + '.');
  }
  const key = normalized(item.fr);
  if (vocabSeen.has(key)) duplicateVocabulary.push({ word: item.fr, ids: [vocabSeen.get(key), item.id] });
  else vocabSeen.set(key, item.id);
}
stats.additionalVocabulary = { count: vocabulary.length, duplicateFrenchEntries: duplicateVocabulary.length };
if (duplicateVocabulary.length) addWarning('Duplicate French headwords found in additional vocabulary: ' + duplicateVocabulary.length + '.');

const citizenship = Array.isArray(curriculum.citizenshipTrack) ? curriculum.citizenshipTrack : [];
let citizenshipQuestionCount = 0;
for (const unit of citizenship) {
  for (const field of ['title', 'objective', 'grammar', 'task']) {
    if (!nonEmpty(unit[field])) addError('Citizenship track item ' + unit.n + ' is missing ' + field + '.');
  }
  if (!Array.isArray(unit.quiz) || unit.quiz.length !== 8) {
    addError('Expected eight citizenship-track quiz questions in item ' + unit.n + '.');
  }
  for (const [index, question] of (unit.quiz || []).entries()) {
    citizenshipQuestionCount++;
    if (!Array.isArray(question.options) || !Number.isInteger(question.answer) ||
        question.answer < 0 || question.answer >= question.options.length) {
      addError('Invalid citizenship quiz answer index in item ' + unit.n + ', question ' + (index + 1) + '.');
    }
    if (!nonEmpty(question.q) || !nonEmpty(question.why)) {
      addError('Missing citizenship quiz prompt/rationale in item ' + unit.n + ', question ' + (index + 1) + '.');
    }
  }
}
stats.citizenshipTrack = { units: citizenship.length, questions: citizenshipQuestionCount };

const listening = curriculum.fiveMinuteListening || {};
const paragraphs = Array.isArray(listening.paragraphs) ? listening.paragraphs : [];
const conversationGroups = Array.isArray(listening.conversationsByUnit) ? listening.conversationsByUnit : [];
for (const [index, paragraph] of paragraphs.entries()) {
  if (!nonEmpty(paragraph.fr) || !nonEmpty(paragraph.en)) addError('Bilingual listening paragraph incomplete at item ' + (index + 1) + '.');
}
let conversationLines = 0;
for (const group of conversationGroups) {
  if (!Array.isArray(group.conversations) || group.conversations.length === 0) {
    addError('No dialogue examples in listening unit ' + group.unit + '.');
  }
  for (const conversation of group.conversations || []) {
    if (!Array.isArray(conversation.lines) || conversation.lines.length < 2) {
      addError('Dialogue has fewer than two turns in listening unit ' + group.unit + ': ' + conversation.title + '.');
    }
    for (const line of conversation.lines || []) {
      conversationLines++;
      if (!nonEmpty(line.fr) || !nonEmpty(line.ar)) {
        addError('Bilingual dialogue line incomplete in listening unit ' + group.unit + ': ' + conversation.title + '.');
      }
    }
  }
}
stats.listening = { bilingualParagraphs: paragraphs.length, conversationGroups: conversationGroups.length, dialogueLines: conversationLines };

console.log('UR French curriculum structural audit');
console.log(JSON.stringify(stats, null, 2));
if (warnings.length) {
  console.log('\nWARNINGS (' + warnings.length + ')');
  warnings.forEach((message) => console.log('- ' + message));
}
if (errors.length) {
  console.error('\nFAILURES (' + errors.length + ')');
  errors.forEach((message) => console.error('- ' + message));
  process.exitCode = 1;
} else {
  console.log('\nPASS: No structural or answer-index failures detected.');
}
console.log('NOTE: This script checks structure, completeness, answer-index bounds, and repeated prompts. It cannot prove that every French sentence or answer is linguistically correct.');
