"use client";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { messageSchema } from "@/schemas/messageSchema";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";
import axios, { AxiosError } from "axios";
import { ApiResponse } from "@/types/ApiResponse";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const Page = () => {
  const { toast } = useToast();
  const [suggestedMessages, setSuggestedMessages] = useState([
    "What's your favourite movie?",
    "Do you have any pets?",
    "What's your dream job?",
  ]);
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [isSuggestingMessages, setIsSuggestingMessages] = useState(false);
  const { username } = useParams();

  const register = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
    },
  });

  const [responseText, setResponseText] = useState("");

  const fetchStreamingResponse = async () => {
    setIsSuggestingMessages(true);
    setResponseText("");

    const res = await fetch("/api/suggest-messages", { method: "POST" });

    if (!res.ok) {
      toast({
        title: "Failed",
        description: "Failed to suggest messages",
        variant: "destructive",
      });
      setIsSuggestingMessages(false);
      return;
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        setResponseText(
          (prev) => prev + decoder.decode(value, { stream: true })
        );
      }
    }
  };

  useEffect(() => {
    const msgArr = responseText.split("||");
    if (msgArr[0]) {
      setSuggestedMessages(msgArr);
      setIsSuggestingMessages(false);
    }
  }, [responseText]);

  const handleSendMessage = async (content: z.infer<typeof messageSchema>) => {
    setIsSubmittingMessage(true);

    try {
      const response = await axios.post<ApiResponse>("/api/send-message", {
        username,
        ...content,
      });

      if (!response.data.success) {
        toast({
          title: "Failed",
          description: response.data.message,
          variant: "destructive",
        });
      }

      toast({
        title: "Success",
        description: response.data.message,
      });

      register.reset({ content: "" });
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      let errorMessage = axiosError.response?.data.message;
      toast({
        title: "Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  return (
    <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
      <div className="px-4 md:px-24">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Public Profile Link
        </h1>

        <Form {...register}>
          <form
            onSubmit={register.handleSubmit(handleSendMessage)}
            className="flex flex-col justify-center gap-4"
          >
            <FormField
              control={register.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">
                    Send Anonymous Message to @{username}
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="p-6 pb-10 focus:outline-none text-wrap"
                      placeholder="Write your anonymous message here"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button disabled={isSubmittingMessage} className="mb-8">
              Send it
            </Button>
          </form>
        </Form>
        <Separator />
        <div className="pt-6">
          <Button
            onClick={fetchStreamingResponse}
            disabled={isSuggestingMessages}
            className="mb-4"
          >
            Suggest Messages
          </Button>
          <h4>Click on any message below to select it</h4>
          <div className="flex flex-col gap-6 p-4 border mt-4 rounded-sm">
            {suggestedMessages.map((message, i) => (
              <Button
                onClick={() => register.setValue("content", message)}
                className="bg-white-100 text-black text-wrap border hover:bg-white-100 hover:text-black"
                key={i}
              >
                {message}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
