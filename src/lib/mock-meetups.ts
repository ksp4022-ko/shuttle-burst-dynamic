export type Meetup = {
  id: string;
  date: string;
  weekday: string;
  time: string;
  venue: string;
  capacity: number;
  fee: string;
  ball: string;
  roster: string[];
  seasonMembers: string[];
};

export const MEETUPS: Meetup[] = [
  {
    id: "m1",
    date: "08 / 22",
    weekday: "週五",
    time: "19:00 – 22:00",
    venue: "松山運動中心 3F",
    capacity: 24,
    fee: "NT$150",
    ball: "AS-9 / 3 顆",
    roster: ["阿凱", "小柔", "Wei", "老張", "Nina", "阿德"],
    seasonMembers: ["阿凱", "老張", "Nina", "Sammy", "小豪"],
  },
  {
    id: "m2",
    date: "08 / 25",
    weekday: "週一",
    time: "20:00 – 23:00",
    venue: "中山羽球館 B 場",
    capacity: 18,
    fee: "NT$180",
    ball: "AS-10 / 2 顆",
    roster: ["Sammy", "小豪", "Yuki"],
    seasonMembers: ["Sammy", "小豪", "Yuki", "阿德"],
  },
  {
    id: "m3",
    date: "08 / 28",
    weekday: "週四",
    time: "18:30 – 21:30",
    venue: "內湖國小活動中心",
    capacity: 20,
    fee: "NT$120",
    ball: "AS-9 / 3 顆",
    roster: ["老張", "Nina", "阿凱", "Kevin", "小柔"],
    seasonMembers: ["老張", "Nina", "Kevin"],
  },
];
