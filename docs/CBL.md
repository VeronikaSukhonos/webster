# Challenge Based Learning (CBL)

This document contains a short description of our progress after every completed **[CBL](https://education.apple.com/learning-center/R006554)** stage of working on **[webster](https://github.com/VeronikaSukhonos/webster.git)**.

## Engage

**Big Idea**: Design.

**Essential Question**: How to create visual content without specific skills?

**Challenge**: Create an editor that allows every user without design skills to create and process images.

## Investigate

This section contains short conclusions we have made after completing guiding questions and activities.

### Guiding Questions

**_What online graphic editors are there? Where is an online design tool used most often?_**

There are many online graphic editors, for example, Canva, Figma, Photopea, Picsart. According to the Internet and our own survey, the most popular user-friendly design tool is Canva. Online design tools are mainly used in marketing (creating labels or advertisements), in social media (for posts and stories), in education (for example, for presentations) and in everyday life for hobby or entertainment.

**_What basic features do the most popular online design tools have?_**

The most popular online design tools have basic features like work with text, vector shapes, images, free drawing, layer management, ability to export project elements in various formats (PNG, JPG, SVG, PDF, etc.).

**_What are the pros and cons of online editors?_**

Online editors have an intuitive design understandable even for non-professionals, a wide set of tools, an ability to share projects; in some editors, image generation with AI is provided. Despite this, the main disadvantage of many online editors is not full functionality without paid subscription.

**_What is a color palette? What is an image? What is a font?_**

A color palette is the set of available colors from which an image can be made. An image is a visual representation of something; in the context of signal processing, it is a distributed amplitude of color(s). A font is a block of data (or file) consisting of descriptions of individual characters in a set used by a program (or part of the operating system's graphical shell) when displaying text.

**_What is the difference between various image formats? What is the difference between PDF and JPG files?_**

The differences between image formats may be losses of quality, support by different programs, support of channels and size of a file. For example, the differences between PDF and JPG files are that a JPG image has only a grid of pixels, and PDF can also contain text, raster and vector graphics; due to file compression, JPG images are light-weight, but have losses of quality ("artifacts", pixelization when zooming in), while PDF images weigh more, but don't lose quality; JPG files can be opened in simple graphic editors, and a specialized software is necessary for editing PDF files.

**_How to create beautiful design even if you aren't a designer?_**

If you are not a designer, you can make beautiful designs by using templates, high-quality visuals (photography, icons, vectors) and not overwhelming your design with a lot of colors, fonts and other elements.

**_What architecture can be implemented here?_**

The most suitable architecture for this project is MVC: all the containers (db, backend and frontend) are separated and can be changed independently of each other.

**_What graphic libraries/frameworks are better for developing an online design tool?_**

For developing online design tools, Konva JS is very useful because it provides a lot of preset basic elements like free drawing, images, shapes, text, etc., and has the understandable documentation, which makes using this library easier.

**_What are the benefits of using asynchronous operations?_**

Asynchronous operations allow a system to initiate a task and move on to other work without waiting for that task to finish. This non-blocking approach significantly improves application responsiveness, increases throughput, makes better use of hardware resources, and helps build highly scalable architectures.

**_How to work with graphic?_**

We can work with graphic by using different tools, methods and formats depending on what we are trying to build. Because we deal with raster in this product, we should work with canvas elements and frameworks that draw them.

**_How to integrate your product with other services?_**

It is possible to integrate other services to the product by using APIs (for example, it is possible to integrate Unsplash API for fetching built-in pictures via requests).

**_What is an HTML Canvas?_**

An HTML Canvas is the element for representing graphics and animation on the web page via scripts.

**_What is the drag-and-drop feature?_**

The drag-and-drop feature is the feature which enables a user to move elements from one place (program or web page) to another by dragging.

**_How many pixels do high-resolution images have?_**

High-resolution images generally have anywhere from 2 to 50+ megapixels (MP), depending on how they will be used. For example, Full HD pictures are 1920 × 1080 pixels (2.1 MP), 4K Ultra HD pictures - 3840 × 2160 pixels (8.3 MP), 8K Ultra HD pictures - 7680 × 4320 pixels (33.1 MP), pictures for 4 × 6 inch print - 1200 × 1800 pixels (2.1 MP) and for 8 × 10 inch print - 2400 × 3000 pixels (7.2 MP).

**_What is the difference between a PNG-file (raster image) and a SVG-file (vector image)?_**

The key difference between raster and vector images is that raster images are described by a grid of pixels, and vector images are described by mathematical formulas and geometrical figures. That is why SVG images can be zoomed in without losses of quality.

**_Where are different image formats used?_**

Raster formats (JPG, PNG, WEBP, TIFF) are mainly used in photography, digital pictures and scans, and vector formats (SVG, AI, EPS, CDR) are used in blueprints, logotypes, icons, fonts and layouts for outdoor advertising.

**_How are digital images processed?_**

Digital images are processed by converting them into pixels - the smallest controllable units of a digital image. They are structured in a grid of numeric values and each of them contains information about color.

**_How to implement dynamic drawing?_**

To implement dynamic drawing, it is needed to use different event listeners and to update canvas continuously. Combination of JavaScript and some high-performance frameworks can make it possible in web browsers.

**_What successful design product can you use as an example?_**

Our main inspiration in creating web designer were such successful editors as Canva and Figma: they were a perfect example of intuitive and user-friendly design and sets of good useful tools.

**_What are the main problems of existing design tools?_**

Existing design tools excel at visual layout but struggle with code translation, dynamic responsiveness, and scaling data. These limitations create friction between the design phase and the final built product.

**_How to develop a user-friendly interface for the editor?_**

Developing a user-friendly editor interface requires minimizing cognitive load by following core UI/UX design principles: hiding advanced features until needed, utilizing progressive disclosure, and ensuring clear visual hierarchy.

**_What are the main differences among popular online design tools?_**

The main difference between modern online design tools lies in their focus, ranging from the formats they support to the specific features required to achieve the unique goals of each editor.

**_What technologies will you use to overcome the challenge?_**

The main technologies used in our project is Docker for organizing work of backend and frontend, TypeScript as a program language for both backend and frontend, PostgreSQL as a database, NestJS for server part, React for web app, Konva JS as a tool to work with canvas and Render as a deploy hosting.

### Guiding Activities

For a better understanding of what features are better to implement in our own design tool, we analyzed the real users, asking them the following questions:

1. _What is your age_?
2. _Which browser-based graphic editors do you use most often_?
3. _How often do you use online editors_?
4. _For what purpose do you most often use online editors_?
5. _What features do you use most often_?
6. _What additional features do you find most useful_?
7. _Which templates do you find most useful_?
8. _What filters or effects do you use most often_?
9. _What do you NOT like about existing online editors? What features do you miss?_
10. _On which social networks do you most often share your works_?

We also analyzed advantages and disadvantages of **_Canva_**, **_Figma_**, **_Photopea_** and **_Picsart_**, and used them as reference for UI and logic of our service.

After this research, we identified that **_the main idea of our product_** is to offer users without any special skills the most needed features (such as ready-made templates) for simple image creation and processing, as well as provide them with additional useful functions that are mainly paid in existing editors-analogs.

## Act

We started developing our project from modeling its design, database and identifying its main functions. After we had got an idea of what we need to do, we moved to writing the code and preparations for deploy on hosting. This app is mostly about working in web browser, so once the backend and deploy were completed everyone got to work on the frontend. The last stage of our work was testing the final product and preparations for its presentation.

We used GitHub for easy collaboration and Telegram for quick communication.

As a result we got a web designer which allows users to create project from template, image or blank sheet, draw, work with shapes, text, images and their layers, view and manage history of project's changes, export image to users' devices and share projects' by link, email, Fasebook and Pinterest.
