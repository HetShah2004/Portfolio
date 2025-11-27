from django.db import models

class Skill(models.Model):
    name = models.CharField(max_length=50)
    icon = models.ImageField(upload_to='skills/')

    def __str__(self):
        return self.name

class Project(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    image = models.ImageField(upload_to='projects/')
    live_link = models.URLField(blank=True, null=True)
    github_link = models.URLField(blank=True, null=True)
    skills = models.ManyToManyField(Skill, related_name='projects')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title
