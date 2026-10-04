---
categories:
  - Engineering
topics:
  - distributed systems
sources:
  - article
updated: 2026-09-24
---
It is a part of structural design pattern. 
Structural design pattern is a way to combine or arrange different classes and objects o form a complex or bigger structure to solve a particular problem. 

Facade Pattern helps to hide the system complexity from the client, hence called as facade. Main idea is to expose only necessary details to the client. So client will only have one front door, and the rest of the working all happens behind the scenes. 

![](https://x.com/championswimmer/status/2058988176169975879)



```java 
// Subsystem classes
class Amplifier {
    void on() { System.out.println("Amplifier on"); }
    void setVolume(int level) { System.out.println("Volume set to " + level); }
}

class DvdPlayer {
    void on() { System.out.println("DVD player on"); }
    void play(String movie) { System.out.println("Playing '" + movie + "'"); }
}

class Projector {
    void on() { System.out.println("Projector on"); }
    void setInput(String source) { System.out.println("Projector input: " + source); }
}

class Lights {
    void dim(int level) { System.out.println("Lights dimmed to " + level + "%"); }
}

// Facade
class HomeTheaterFacade {
    private final Amplifier amp;
    private final DvdPlayer dvd;
    private final Projector projector;
    private final Lights lights;

    public HomeTheaterFacade(Amplifier amp, DvdPlayer dvd, Projector projector, Lights lights) {
        this.amp = amp;
        this.dvd = dvd;
        this.projector = projector;
        this.lights = lights;
    }

    public void watchMovie(String movie) {
        lights.dim(10);
        projector.on();
        projector.setInput("DVD");
        amp.on();
        amp.setVolume(5);
        dvd.on();
        dvd.play(movie);
    }
}

// Client code
public class Main {
    public static void main(String[] args) {
        HomeTheaterFacade theater = new HomeTheaterFacade(
            new Amplifier(), new DvdPlayer(), new Projector(), new Lights()
        );
        theater.watchMovie("Inception");
    }
}

```

### Pros 
- Easy to test, as we can pass mock easily 
- Less changes needed when we want to add more capabilities , or swap certain capabilities




