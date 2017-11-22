#define ELECTRICITY_PIN A0
#define RELAY_PIN 4
#define BUTTON_PIN 8

int relayState = LOW;
int buttonState = LOW;

void setup() {
  
  Serial.begin(9600); // open serial connection to USB Serial port
  Serial1.begin(9600); // open internal serial connection to MT7688AN
  
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT);
}

void loop() {

  static char buffer[80];
  
  while (Serial1.available() > 0) {
    if (readline(Serial1.read(), buffer, 80) > 0) {
      String status = String(buffer);
      if (status == "on") {
        relayState = HIGH;
      }
      else {
        relayState = LOW;
      }
      digitalWrite(RELAY_PIN, relayState);
    }
  }

  buttonState = digitalRead(BUTTON_PIN);
  if (buttonState == HIGH) {
    if (relayState == LOW) {
      relayState = HIGH;
      Serial1.println("{\"status\": \"on\"}");
    }
    else {
      relayState = LOW;
      Serial1.println("{\"status\": \"off\"}");
    }
    digitalWrite(RELAY_PIN, relayState);
    delay(500);
  }
  // Serial.println(String(readElectricity()));
  
}


int readline(int readch, char *buffer, int len){
  
  static int pos = 0;
  int rpos;

  if (readch > 0) {
    switch (readch) {
      case '\n': 
        rpos = pos;
        pos = 0;  
        return rpos;
      case '\r': 
        rpos = pos;
        pos = 0;  
        return rpos;
      default:
        if (pos < len-1) {
          buffer[pos++] = readch;
          buffer[pos] = 0;
        }
    }
  }
  // No end of line has been found, so return -1.
  return -1;
}


float readElectricity() {
  const int size = 256;
  static int index = 0;
  static int sample[size];
  sample[index] = analogRead(ELECTRICITY_PIN);
  
  int max = 0;
  for (int i = 0; i < size; i++) {
    if (max < sample[i])
      max = sample[i];
  }
  index = (index + 1) % size;
  
  return (float) max/1024*5/800*2000000;
}

