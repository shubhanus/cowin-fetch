const { default: axios } = require("axios");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const defaultPincode = 313001;
const defaultAge = 18;
const centerIdsToCheck = [552582, 546736];

rl.question(`Enter Pincode:(${defaultPincode})`, (pincode) => {
  rl.question(`Enter age:(${defaultAge})`, (age) => {
    recursiveGetFreeSlot(
      Number(pincode) || defaultPincode,
      Number(age) || defaultAge
    );
    rl.close();
  });
});

const getDateTodaysDate = () => {
  const date = new Date();
  const day = `${date.getDate()}`;
  const month = `${date.getMonth() + 1}`;
  return `${day.padStart(2, 0)}-${month.padStart(2, 0)}-${date.getFullYear()}`;
};

const req = {
  getCalByPincode: `https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByPin`,
};

const getAvailableSlots = (centers, age) => {
  const availableCenters = centers.filter((center) => {
    if (
      center.fee_type === "Free" &&
      centerIdsToCheck.reduce(center.center_id)
    ) {
      return center.sessions.find(
        (session) =>
          session.available_capacity > 0 && session.min_age_limit === age
      );
    }
  });
  return availableCenters;
};

const getFreeSlot = (pincode, age, intervel) => {
  const date = getDateTodaysDate();
  return axios
    .get(req.getCalByPincode, {
      params: {
        pincode,
        date,
      },
    })
    .then(({ data }) => {
      const { centers } = data;
      const availableCenters = getAvailableSlots(centers, age);
      return availableCenters;
    });
};

const sleepTime = 500 * 60;
// const sleepTime = 1000;
const getFreeSlotWithFeedback = (pincode, age) => {
  console.log(
    `\n\nFinding availablity for ${pincode}, age ${age} and centers ${centerIdsToCheck.join()} .`
  );
  return new Promise((resolve, reject) => {
    getFreeSlot(pincode, age).then((availableCenters) => {
      if (availableCenters && availableCenters.length) {
        console.log("\n\n\ncenters found:", availableCenters);
        resolve();
      } else {
        reject();
      }
    });
  });
};

const recursiveGetFreeSlot = (pincode, age) => {
  getFreeSlotWithFeedback(pincode, age).catch(() => {
    const timeout = setInterval(async () => {
      try {
        await getFreeSlotWithFeedback(pincode, age);
        clearTimeout(timeout);
        console.log("\n\nbye bye");
      } catch (error) {
        console.log(
          `Oops No availability. Sleeping for ${
            sleepTime / 1000 / 60
          } mins before next attempt.`
        );
      }
    }, sleepTime);
  });
};
